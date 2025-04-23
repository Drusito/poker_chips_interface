/**
 * Servicio para gestionar las salas de juego
 */

const Room = require('../models/Room');
const { GAME_CONFIG } = require('../config/constants');

// Almacén de salas
const rooms = {};

/**
 * Crea una nueva sala
 * @param {string} roomId - Identificador de la sala
 * @returns {Room} - La sala creada
 */
function createRoom(roomId) {
  if (rooms[roomId]) {
    throw new Error(`La sala ${roomId} ya existe`);
  }
  
  const room = new Room(roomId);
  rooms[roomId] = room;
  
  // Configurar limpieza automática para salas inactivas
  setupRoomCleanup(roomId);
  
  return room;
}

/**
 * Obtiene una sala existente
 * @param {string} roomId - Identificador de la sala
 * @returns {Room|null} - La sala o null si no existe
 */
function getRoom(roomId) {
  return rooms[roomId] || null;
}

/**
 * Elimina una sala
 * @param {string} roomId - Identificador de la sala
 * @returns {boolean} - True si se eliminó correctamente
 */
function removeRoom(roomId) {
  if (!rooms[roomId]) {
    return false;
  }
  
  delete rooms[roomId];
  return true;
}

/**
 * Encuentra salas por ID de jugador
 * @param {string} playerId - ID del jugador
 * @returns {Array<Room>} - Lista de salas donde está el jugador
 */
function findRoomsByPlayerId(playerId) {
  const result = [];
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (room.players[playerId]) {
      result.push(room);
    }
  }
  
  return result;
}

/**
 * Obtiene información básica de todas las salas
 * @returns {Array<Object>} - Lista con información básica de las salas
 */
function getAllRoomsInfo() {
  return Object.values(rooms).map(room => ({
    id: room.id,
    playerCount: Object.keys(room.players).length,
    phase: room.currentPhase,
    created: room.created
  }));
}

/**
 * Configura la limpieza automática de salas inactivas
 * @param {string} roomId - Identificador de la sala
 */
function setupRoomCleanup(roomId) {
  const checkInterval = 60000; // 1 minuto
  
  const intervalId = setInterval(() => {
    const room = rooms[roomId];
    
    // Si la sala ya no existe, limpiar el intervalo
    if (!room) {
      clearInterval(intervalId);
      return;
    }
    
    // Verificar si la sala está inactiva
    const now = Date.now();
    const lastActivity = room.lastActionTime || now;
    const inactiveTime = now - lastActivity;
    
    // Si ha estado inactiva por más tiempo del permitido, eliminarla
    if (inactiveTime > GAME_CONFIG.MAX_INACTIVE_TIME) {
      console.log(`Eliminando sala inactiva: ${roomId}`);
      removeRoom(roomId);
      clearInterval(intervalId);
    }
  }, checkInterval);
}

/**
 * Obtiene estadísticas generales de las salas
 * @returns {Object} - Estadísticas de las salas
 */
function getRoomsStats() {
  const totalRooms = Object.keys(rooms).length;
  let totalPlayers = 0;
  let activePlayers = 0;
  let activeGames = 0;
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const playerCount = Object.keys(room.players).length;
    
    totalPlayers += playerCount;
    
    // Contar jugadores activos (conectados)
    for (const playerId in room.players) {
      if (room.players[playerId].connected) {
        activePlayers++;
      }
    }
    
    // Contar juegos activos (no en espera)
    if (room.currentPhase !== 'waiting') {
      activeGames++;
    }
  }
  
  return {
    totalRooms,
    totalPlayers,
    activePlayers,
    activeGames,
    avgPlayersPerRoom: totalRooms > 0 ? (totalPlayers / totalRooms).toFixed(2) : 0
  };
}

module.exports = {
  createRoom,
  getRoom,
  removeRoom,
  findRoomsByPlayerId,
  getAllRoomsInfo,
  getRoomsStats
};