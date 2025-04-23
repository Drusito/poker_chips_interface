/**
 * Manejadores de eventos relacionados con las salas
 */

const roomService = require('../../services/roomService');
const { SOCKET_EVENTS, GAME_CONFIG } = require('../../config/constants');

/**
 * Maneja la unión de un jugador a una sala
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos para unirse a la sala
 */
function handleJoinRoom(socket, io, data) {
  try {
    const { name, roomId } = data;
    
    console.log(`Jugador ${name} intenta unirse a sala ${roomId}`);
    
    // Validaciones básicas
    if (!name || !roomId) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Nombre y ID de sala son requeridos' 
      });
    }
    
    // Obtener o crear la sala
    let room = roomService.getRoom(roomId);
    if (!room) {
      room = roomService.createRoom(roomId);
      console.log(`Sala ${roomId} creada`);
    }
    
    // Verificar si la sala está llena
    if (Object.keys(room.players).length >= GAME_CONFIG.MAX_PLAYERS) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'La sala está llena' 
      });
    }
    
    // Unir el socket a la sala de Socket.IO
    socket.join(roomId);
    
    try {
      // Añadir jugador a la sala
      room.addPlayer(socket.id, name);
      console.log(`Jugador ${name} (${socket.id}) añadido a sala ${roomId}`);
      
      // Notificar al jugador que se ha unido correctamente
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        success: true,
        roomId,
        playerId: socket.id
      });
      
      // Notificar a todos los jugadores el nuevo estado
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
      
      // Mensaje de bienvenida
      socket.emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: `Bienvenido a la sala ${roomId}. Marca "Listo" cuando estés preparado.`
      });
      
      // Notificar a los demás jugadores
      socket.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: `${name} se ha unido a la sala.`
      });
      
    } catch (error) {
      console.error(`Error al añadir jugador: ${error.message}`);
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('Error al unirse a la sala:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al unirse a la sala' 
    });
  }
}

/**
 * Maneja la salida de un jugador de una sala
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} data - Datos para salir de la sala
 */
function handleLeaveRoom(socket, io, data) {
  try {
    const { roomId } = data;
    const room = roomService.getRoom(roomId);
    
    console.log(`Jugador ${socket.id} intenta salir de sala ${roomId}`);
    
    if (!room) {
      return socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
        message: 'Sala no encontrada' 
      });
    }
    
    // Eliminar al jugador de la sala
    if (room.players[socket.id]) {
      const playerName = room.players[socket.id].name;
      
      // Remover el jugador
      room.removePlayer(socket.id);
      console.log(`Jugador ${playerName} (${socket.id}) eliminado de sala ${roomId}`);
      
      // Dejar el canal de Socket.IO
      socket.leave(roomId);
      
      // Notificar al jugador
      socket.emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: `Has salido de la sala ${roomId}.`
      });
      
      // Notificar a los demás jugadores
      io.to(roomId).emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: `${playerName} ha salido de la sala.`
      });
      
      // Actualizar estado de la sala
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
      
      // Si la sala está vacía, eliminarla
      if (Object.keys(room.players).length === 0) {
        roomService.removeRoom(roomId);
        console.log(`Sala ${roomId} eliminada por quedarse vacía`);
      }
    }
    
  } catch (error) {
    console.error('Error al salir de la sala:', error);
    socket.emit(SOCKET_EVENTS.GAME_ERROR, { 
      message: 'Error al salir de la sala' 
    });
  }
}

/**
 * Maneja la desconexión de un jugador
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 * @param {Object} room - Sala de la que se desconecta
 */
function handlePlayerDisconnect(socket, io, room) {
  try {
    // Verificar si el jugador está en la sala
    if (room.players[socket.id]) {
      const playerName = room.players[socket.id].name;
      
      console.log(`Jugador ${playerName} (${socket.id}) desconectado de sala ${room.id}`);
      
      // Actualizar estado de conexión del jugador
      room.players[socket.id].setConnected(false);
      
      // Si estaba en su turno, pasar al siguiente
      if (room.currentTurn === socket.id) {
        room.nextTurn();
      }
      
      // Notificar a los demás jugadores
      io.to(room.id).emit(SOCKET_EVENTS.GAME_MESSAGE, {
        message: `${playerName} se ha desconectado.`
      });
      
      // Actualizar estado de la sala
      io.to(room.id).emit(SOCKET_EVENTS.ROOM_STATE, room.getState());
      
      // Si el juego ya no tiene suficientes jugadores, reiniciar
      const activePlayers = Object.values(room.players).filter(p => p.connected);
      if (activePlayers.length < GAME_CONFIG.MIN_PLAYERS) {
        room.resetGame();
        io.to(room.id).emit(SOCKET_EVENTS.GAME_MESSAGE, {
          message: 'No hay suficientes jugadores activos. El juego se ha reiniciado.'
        });
      }
      
      // Si no quedan jugadores, eliminar la sala
      if (Object.keys(room.players).length === 0) {
        roomService.removeRoom(room.id);
        console.log(`Sala ${room.id} eliminada por quedarse vacía tras desconexión`);
      }
    }
    
  } catch (error) {
    console.error('Error al manejar desconexión:', error);
  }
}

module.exports = {
  handleJoinRoom,
  handleLeaveRoom,
  handlePlayerDisconnect
};