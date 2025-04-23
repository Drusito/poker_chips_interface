/**
 * Gestión de conexiones y eventos de Socket.IO
 */

const { SOCKET_EVENTS } = require('../config/constants');
const roomService = require('../services/roomService');
const gameHandlers = require('./handlers/gameHandlers');
const roomHandlers = require('./handlers/roomHandlers');
const playerHandlers = require('./handlers/playerHandlers');

/**
 * Configura los eventos de Socket.IO
 * @param {Object} io - Instancia de Socket.IO
 */
function socketManager(io) {
  // Middleware para logging
  io.use((socket, next) => {
    console.log(`Nueva conexión: ${socket.id}`);
    next();
  });

  // Manejo de conexiones
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Eventos del cliente
    setupClientEvents(socket, io);

    // Manejo de desconexión
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });
  });
}

/**
 * Configura los eventos que puede emitir el cliente
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 */
function setupClientEvents(socket, io) {
  // Eventos de sala
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
    console.log(`Evento JOIN_ROOM recibido de ${socket.id}:`, data);
    roomHandlers.handleJoinRoom(socket, io, data);
  });
  
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
    console.log(`Evento LEAVE_ROOM recibido de ${socket.id}:`, data);
    roomHandlers.handleLeaveRoom(socket, io, data);
  });
  
  // Eventos de jugador
  socket.on(SOCKET_EVENTS.PLAYER_READY, (data) => {
    console.log(`Evento PLAYER_READY recibido de ${socket.id}:`, data);
    playerHandlers.handlePlayerReady(socket, io, data);
  });
  
  socket.on(SOCKET_EVENTS.PLAYER_ACTION, (data) => {
    console.log(`Evento PLAYER_ACTION recibido de ${socket.id}:`, data);
    gameHandlers.handlePlayerAction(socket, io, data);
  });
  
  socket.on(SOCKET_EVENTS.NEXT_HAND, (data) => {
    console.log(`Evento NEXT_HAND recibido de ${socket.id}:`, data);
    gameHandlers.handleNextHand(socket, io, data);
  });
}

/**
 * Maneja la desconexión de un cliente
 * @param {Object} socket - Socket del cliente
 * @param {Object} io - Instancia de Socket.IO
 */
function handleDisconnect(socket, io) {
  console.log(`Cliente desconectado: ${socket.id}`);
  
  // Buscar en qué salas estaba el jugador
  const rooms = roomService.findRoomsByPlayerId(socket.id);
  
  // Procesar la desconexión en cada sala
  rooms.forEach(room => {
    roomHandlers.handlePlayerDisconnect(socket, io, room);
  });
}

module.exports = socketManager;