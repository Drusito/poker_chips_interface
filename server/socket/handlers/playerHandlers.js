/**
 * Manejadores de eventos relacionados con los jugadores
 */

const roomService = require('../../services/roomService');
const { SOCKET_EVENTS } = require('../../config/constants');

/**
 * Maneja cuando un jugador se marca como listo
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos del evento
 */
function handlePlayerReady(socket, io, data) {
  try {
    const { roomId } = data;
    const room = roomService.getRoom(roomId);
    
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
    
    console.log(`Jugador ${socket.id} marcado como listo en sala ${roomId}`);
    
    // Marcar jugador como listo
    const allReady = room.setPlayerReady(socket.id);
    
    // Notificar a todos el nuevo estado
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
    
    // Notificar al jugador
    socket.emit(SOCKET_EVENTS.GAME_MESSAGE, {
      message: 'Te has marcado como listo.'
    });
    
    console.log(`¿Todos listos? ${allReady} - Fase actual: ${room.currentPhase}`);
    
    // Si todos están listos, comenzar el juego
    if (allReady) {
      console.log("Iniciando nueva mano en la sala " + roomId);
      
      // Iniciar una nueva mano
      try {
        room.startNewHand();
        console.log("Mano iniciada correctamente");
      } catch (error) {
        console.error("Error al iniciar mano:", error);
      }
      
      // Notificar a todos los jugadores
      io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: '¡Todos listos! La partida comienza.'
      });
      
      // Actualizar estado del juego
      io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE, room.getState());
      
      // Notificar al jugador que tiene el turno
      if (room.currentTurn) {
        io.to(room.currentTurn).emit(SOCKET_EVENTS.PLAYER_TURN, {
          timeLimit: 30,
          options: getValidOptions(room, room.currentTurn)
        });
      }
    }
    
  } catch (error) {
    console.error('Error al marcar como listo:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al marcar como listo: ' + error.message 
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
  options.fold = true;
  
  // Comprobar si puede pasar (check)
  if (player.currentBet === room.currentBet) {
    options.check = true;
  }
  
  // Comprobar si puede igualar (call)
  const callAmount = room.currentBet - player.currentBet;
  if (callAmount > 0 && player.balance >= callAmount) {
    options.call = {
      amount: callAmount
    };
  }
  
  // Comprobar si puede apostar (bet)
  if (room.currentBet === 0 && player.balance > 0) {
    options.bet = {
      min: 2, // Apuesta mínima
      max: player.balance
    };
  }
  
  // Comprobar si puede subir (raise)
  if (room.currentBet > 0 && player.balance > callAmount) {
    const minRaise = room.currentBet * 2 - player.currentBet;
    if (player.balance >= minRaise) {
      options.raise = {
        min: minRaise,
        max: player.balance
      };
    }
  }
  
  // Comprobar si puede ir all-in
  if (player.balance > 0) {
    options.allIn = {
      amount: player.balance
    };
  }
  
  return options;
}

/**
 * Maneja la actualización de datos de un jugador
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos a actualizar
 */
function handlePlayerUpdate(socket, io, data) {
  try {
    const { roomId, playerData } = data;
    const room = roomService.getRoom(roomId);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    const player = room.players[socket.id];
    if (!player) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    // Permitir solo actualizar ciertos campos
    const allowedFields = ['avatar'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (playerData.hasOwnProperty(field)) {
        updates[field] = playerData[field];
      }
    }
    
    // Actualizar datos
    Object.assign(player, updates);
    
    // Notificar cambios
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
    
  } catch (error) {
    console.error('Error al actualizar jugador:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al actualizar datos del jugador' 
    });
  }
}

/**
 * Maneja la acción de añadir fondos a un jugador
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos de la recarga
 */
function handleAddFunds(socket, io, data) {
  try {
    const { roomId, amount } = data;
    const room = roomService.getRoom(roomId);
    
    // Validaciones básicas
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    const player = room.players[socket.id];
    if (!player) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'No eres parte de esta sala' 
      });
    }
    
    // Validar cantidad
    if (!amount || amount <= 0) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Cantidad no válida' 
      });
    }
    
    // Añadir fondos
    player.addFunds(amount);
    
    // Notificar al jugador
    socket.emit(SOCKET_EVENTS.GAME_MESSAGE, {
      message: `Has añadido ${amount}€ a tu balance.`
    });
    
    // Actualizar estado
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
    
  } catch (error) {
    console.error('Error al añadir fondos:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al añadir fondos' 
    });
  }
}

module.exports = {
  handlePlayerReady,
  handlePlayerUpdate,
  handleAddFunds
};