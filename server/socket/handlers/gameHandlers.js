<<<<<<< HEAD
/**
 * Manejadores de eventos relacionados con el juego
 */

const roomService = require('../../services/roomService');
const { SOCKET_EVENTS, PLAYER_ACTIONS, POKER_RULES } = require('../../config/constants');

/**
 * Maneja las acciones de los jugadores (apostar, retirarse, etc.)
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos de la acción
 */
function handlePlayerAction(socket, io, data) {
  try {
    const { roomId, action, amount } = data;
    const room = roomService.getRoom(roomId);
    
    console.log(`Acción recibida: ${action} con cantidad ${amount} en sala ${roomId}`);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    if (!room.players[socket.id]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    if (room.currentTurn !== socket.id) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No es tu turno' 
      });
    }
    
    // Validar tipo de acción
    if (!Object.values(PLAYER_ACTIONS).includes(action)) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Acción no válida' 
      });
    }
    
    // Ejecutar la acción
    try {
      const result = room.processPlayerAction(socket.id, action, amount);
      console.log(`Acción procesada correctamente: ${action}`);
      
      // Notificar a todos los jugadores
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE, room.getState());
      
      // Notificar mensaje según la acción
      let actionMessage = '';
      switch (action) {
        case 'fold':
          actionMessage = `${room.players[socket.id].name} se ha retirado.`;
          break;
        case 'check':
          actionMessage = `${room.players[socket.id].name} pasa.`;
          break;
        case 'call':
          actionMessage = `${room.players[socket.id].name} iguala ${result.amount}€.`;
          break;
        case 'bet':
          actionMessage = `${room.players[socket.id].name} apuesta ${amount}€.`;
          break;
        case 'raise':
          actionMessage = `${room.players[socket.id].name} sube a ${amount}€.`;
          break;
        case 'allIn':
          actionMessage = `${room.players[socket.id].name} va all-in con ${room.players[socket.id].balance + amount}€!`;
          break;
      }
      
      io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, { 
        message: actionMessage 
      });
      
      // Si es el turno de alguien, notificarle específicamente
      if (room.currentTurn) {
        console.log(`Turno actual: ${room.currentTurn}`);
        io.to(room.currentTurn).emit(SOCKET_EVENTS.PLAYER_TURN, {
          timeLimit: 30,  // Tiempo en segundos para actuar
          options: getValidOptions(room, room.currentTurn)
        });
      }
      
      // Si estamos en showdown, finalizar la mano automáticamente
      if (room.currentPhase === 'showdown') {
        console.log("Fase de showdown alcanzada");
        
        // En un juego real aquí se determinaría el ganador
        // Para simplificar, usamos el primer jugador no retirado
        const activePlayerIds = Object.keys(room.players).filter(
          id => !room.players[id].folded
        );
        
        if (activePlayerIds.length === 1) {
          // Solo queda un jugador, es el ganador
          const winnerId = activePlayerIds[0];
          console.log(`Solo queda un jugador activo: ${winnerId}`);
          finishHand(io, room, winnerId);
        } else {
          // Varios jugadores activos, se determinaría el ganador por la fuerza de la mano
          console.log("Varios jugadores activos en showdown");
          io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, {
            message: 'Ronda terminada. Seleccione un ganador manualmente.'
          });
        }
      }
      
    } catch (error) {
      console.error("Error al procesar acción:", error);
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error al procesar acción:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al procesar la acción' 
    });
  }
}

/**
 * Maneja la solicitud para pasar a la siguiente mano
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos para la siguiente mano
 */
function handleNextHand(socket, io, data) {
  try {
    const { roomId, winnerId } = data;
    const room = roomService.getRoom(roomId);
    
    console.log(`Solicitud de siguiente mano recibida. Ganador: ${winnerId}`);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    if (!room.players[socket.id]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    // Verificar que el ganador existe
    if (!room.players[winnerId]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Jugador ganador no válido' 
      });
    }
    
    // Finalizar la mano actual
    finishHand(io, room, winnerId);
    
  } catch (error) {
    console.error('Error al iniciar nueva mano:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al iniciar nueva mano' 
    });
  }
}

/**
 * Finaliza una mano y distribuye el bote
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} room - Sala de juego
 * @param {string} winnerId - ID del jugador ganador
 */
function finishHand(io, room, winnerId) {
  try {
    // Finalizar la mano actual y obtener resultado
    const result = room.finishHand(winnerId);
    console.log(`Mano finalizada. Ganador: ${result.winner.name}, Bote: ${result.pot}`);
    
    // Notificar a todos los jugadores
    io.to(room.id).emit(SOCKET_EVENTS.HAND_RESULT, result);
    io.to(room.id).emit(SOCKET_EVENTS.GAME_STATE, room.getState());
    
    // Mensaje para preparar la siguiente mano
    io.to(room.id).emit(SOCKET_EVENTS.GAME_MESSAGE, {
      message: 'Prepárate para la siguiente mano. Pulsa "Listo" cuando estés preparado.'
    });
    
  } catch (error) {
    console.error('Error al finalizar mano:', error);
    io.to(room.id).emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al finalizar la mano' 
    });
  }
}

/**
 * Obtiene las opciones válidas para un jugador en su turno
 * @param {Object} room - Sala de juego
 * @param {string} playerId - ID del jugador
 * @returns {Object} - Opciones válidas para el jugador
 */
/**
 * Obtiene las opciones válidas para un jugador en su turno
 * @param {Object} room - Sala de juego
 * @param {string} playerId - ID del jugador
 * @returns {Object} - Opciones válidas para el jugador
 */
function getValidOptions(room, playerId) {
    const player = room.players[playerId];
    const options = {};
    
    // Siempre se puede retirar
    options[PLAYER_ACTIONS.FOLD] = true;
    
    // Comprobar si puede pasar (check)
    if (player.currentBet === room.currentBet) {
      options[PLAYER_ACTIONS.CHECK] = true;
    }
    
    // Comprobar si puede igualar (call)
    const callAmount = room.currentBet - player.currentBet;
    if (callAmount > 0 && player.balance >= callAmount) {
      options[PLAYER_ACTIONS.CALL] = {
        amount: callAmount
      };
    }
    
    // Comprobar si puede apostar (bet)
    if (room.currentBet === 0 && player.balance > 0) {
      options[PLAYER_ACTIONS.BET] = {
        min: POKER_RULES.MIN_BET,
        max: player.balance
      };
    }
    
    // Comprobar si puede subir (raise)
    if (room.currentBet > 0 && player.balance > callAmount) {
      // En póker, la subida mínima suele ser el doble de la apuesta actual
      const minRaise = Math.min(room.currentBet * 2, player.balance + player.currentBet);
      
      if (player.balance >= (minRaise - player.currentBet)) {
        options[PLAYER_ACTIONS.RAISE] = {
          min: minRaise,
          max: player.balance + player.currentBet
        };
      }
    }
    
    // Comprobar si puede ir all-in
    if (player.balance > 0) {
      options[PLAYER_ACTIONS.ALL_IN] = {
        amount: player.balance
      };
    }
    
    console.log(`Opciones para jugador ${playerId}:`, options);
    return options;
  }

module.exports = {
  handlePlayerAction,
  handleNextHand
=======
/**
 * Manejadores de eventos relacionados con el juego
 */

const roomService = require('../../services/roomService');
const { SOCKET_EVENTS, PLAYER_ACTIONS } = require('../../config/constants');

/**
 * Maneja las acciones de los jugadores (apostar, retirarse, etc.)
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos de la acción
 */
function handlePlayerAction(socket, io, data) {
  try {
    const { roomId, action, amount } = data;
    const room = roomService.getRoom(roomId);
    
    console.log(`Acción recibida: ${action} con cantidad ${amount} en sala ${roomId}`);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    if (!room.players[socket.id]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    if (room.currentTurn !== socket.id) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No es tu turno' 
      });
    }
    
    // Validar tipo de acción
    if (!Object.values(PLAYER_ACTIONS).includes(action)) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Acción no válida' 
      });
    }
    
    // Ejecutar la acción
    try {
      const result = room.processPlayerAction(socket.id, action, amount);
      console.log(`Acción procesada correctamente: ${action}`);
      
      // Notificar a todos los jugadores
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE, room.getState());
      
      // Notificar mensaje según la acción
      let actionMessage = '';
      switch (action) {
        case 'fold':
          actionMessage = `${room.players[socket.id].name} se ha retirado.`;
          break;
        case 'check':
          actionMessage = `${room.players[socket.id].name} pasa.`;
          break;
        case 'call':
          actionMessage = `${room.players[socket.id].name} iguala ${result.amount}€.`;
          break;
        case 'bet':
          actionMessage = `${room.players[socket.id].name} apuesta ${amount}€.`;
          break;
        case 'raise':
          actionMessage = `${room.players[socket.id].name} sube a ${amount}€.`;
          break;
        case 'allIn':
          actionMessage = `${room.players[socket.id].name} va all-in con ${room.players[socket.id].balance + amount}€!`;
          break;
      }
      
      io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, { 
        message: actionMessage 
      });
      
      // Si es el turno de alguien, notificarle específicamente
      if (room.currentTurn) {
        console.log(`Turno actual: ${room.currentTurn}`);
        io.to(room.currentTurn).emit(SOCKET_EVENTS.PLAYER_TURN, {
          timeLimit: 30,  // Tiempo en segundos para actuar
          options: getValidOptions(room, room.currentTurn)
        });
      }
      
      // Si estamos en showdown, finalizar la mano automáticamente
      if (room.currentPhase === 'showdown') {
        console.log("Fase de showdown alcanzada");
        
        // En un juego real aquí se determinaría el ganador
        // Para simplificar, usamos el primer jugador no retirado
        const activePlayerIds = Object.keys(room.players).filter(
          id => !room.players[id].folded
        );
        
        if (activePlayerIds.length === 1) {
          // Solo queda un jugador, es el ganador
          const winnerId = activePlayerIds[0];
          console.log(`Solo queda un jugador activo: ${winnerId}`);
          finishHand(io, room, winnerId);
        } else {
          // Varios jugadores activos, se determinaría el ganador por la fuerza de la mano
          console.log("Varios jugadores activos en showdown");
          io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, {
            message: 'Ronda terminada. Seleccione un ganador manualmente.'
          });
        }
      }
      
    } catch (error) {
      console.error("Error al procesar acción:", error);
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error al procesar acción:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al procesar la acción' 
    });
  }
}

/**
 * Maneja la solicitud para pasar a la siguiente mano
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos para la siguiente mano
 */
function handleNextHand(socket, io, data) {
  try {
    const { roomId, winnerId } = data;
    const room = roomService.getRoom(roomId);
    
    console.log(`Solicitud de siguiente mano recibida. Ganador: ${winnerId}`);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    if (!room.players[socket.id]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    // Verificar que el ganador existe
    if (!room.players[winnerId]) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Jugador ganador no válido' 
      });
    }
    
    // Finalizar la mano actual
    finishHand(io, room, winnerId);
    
  } catch (error) {
    console.error('Error al iniciar nueva mano:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al iniciar nueva mano' 
    });
  }
}

/**
 * Finaliza una mano y distribuye el bote
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} room - Sala de juego
 * @param {string} winnerId - ID del jugador ganador
 */
function finishHand(io, room, winnerId) {
  try {
    // Finalizar la mano actual y obtener resultado
    const result = room.finishHand(winnerId);
    console.log(`Mano finalizada. Ganador: ${result.winner.name}, Bote: ${result.pot}`);
    
    // Notificar a todos los jugadores
    io.to(room.id).emit(SOCKET_EVENTS.HAND_RESULT, result);
    io.to(room.id).emit(SOCKET_EVENTS.GAME_STATE, room.getState());
    
    // Mensaje para preparar la siguiente mano
    io.to(room.id).emit(SOCKET_EVENTS.GAME_MESSAGE, {
      message: 'Prepárate para la siguiente mano. Pulsa "Listo" cuando estés preparado.'
    });
    
  } catch (error) {
    console.error('Error al finalizar mano:', error);
    io.to(room.id).emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al finalizar la mano' 
    });
  }
}

/**
 * Obtiene las opciones válidas para un jugador en su turno
 * @param {Object} room - Sala de juego
 * @param {string} playerId - ID del jugador
 * @returns {Object} - Opciones válidas para el jugador
 */
function getValidOptions(room, playerId) {
  const player = room.players[playerId];
  const options = {};
  
  // Siempre se puede retirar
  options[PLAYER_ACTIONS.FOLD] = true;
  
  // Comprobar si puede pasar (check)
  if (player.currentBet === room.currentBet) {
    options[PLAYER_ACTIONS.CHECK] = true;
  }
  
  // Comprobar si puede igualar (call)
  const callAmount = room.currentBet - player.currentBet;
  if (callAmount > 0 && player.balance >= callAmount) {
    options[PLAYER_ACTIONS.CALL] = {
      amount: callAmount
    };
  }
  
  // Comprobar si puede apostar (bet)
  if (room.currentBet === 0 && player.balance > 0) {
    options[PLAYER_ACTIONS.BET] = {
      min: 2, // Apuesta mínima
      max: player.balance
    };
  }
  
  // Comprobar si puede subir (raise)
  if (room.currentBet > 0 && player.balance > callAmount) {
    const minRaise = room.currentBet * 2 - player.currentBet;
    if (player.balance >= minRaise) {
      options[PLAYER_ACTIONS.RAISE] = {
        min: minRaise,
        max: player.balance
      };
    }
  }
  
  // Comprobar si puede ir all-in
  if (player.balance > 0) {
    options[PLAYER_ACTIONS.ALL_IN] = {
      amount: player.balance
    };
  }
  
  return options;
}

module.exports = {
  handlePlayerAction,
  handleNextHand
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
};