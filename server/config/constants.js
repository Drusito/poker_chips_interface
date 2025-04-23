<<<<<<< HEAD
/**
 * Constantes globales para la aplicación
 */

// Configuración del servidor
const PORT = process.env.PORT || 3000;

// Configuraciones del juego
const GAME_CONFIG = {
  DEFAULT_BALANCE: 2000,      // Balance inicial por defecto
  MIN_PLAYERS: 2,             // Mínimo número de jugadores para empezar
  MAX_PLAYERS: 8,             // Máximo número de jugadores por sala
  TIMEOUT_SECONDS: 30,        // Tiempo máximo para una acción
  MAX_INACTIVE_TIME: 300000,  // Tiempo máximo de inactividad (5 minutos)
};

// Reglas del juego
const POKER_RULES = {
  SMALL_BLIND: 1,             // Valor de la ciega pequeña
  BIG_BLIND: 2,               // Valor de la ciega grande
  MIN_BET: 2,                 // Apuesta mínima
  MAX_RAISE_MULTIPLIER: 4,    // Multiplicador máximo para subir apuesta
};

// Fases del juego
const GAME_PHASES = {
  WAITING: 'waiting',         // Esperando jugadores
  READY: 'ready',             // Jugadores listos para empezar
  PRE_FLOP: 'preFlop',        // Primera ronda de apuestas
  FLOP: 'flop',               // Segunda ronda de apuestas
  TURN: 'turn',               // Tercera ronda de apuestas
  RIVER: 'river',             // Ronda final de apuestas
  SHOWDOWN: 'showdown',       // Revelación de cartas
};

// Roles de jugadores
const PLAYER_ROLES = {
  DEALER: 'dealer',
  SMALL_BLIND: 'smallBlind',
  BIG_BLIND: 'bigBlind',
  PLAYER: 'player',
};

// Acciones de jugadores
const PLAYER_ACTIONS = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  BET: 'bet',
  RAISE: 'raise',
  ALL_IN: 'allIn',
};

// Eventos de Socket.IO
const SOCKET_EVENTS = {
  // Eventos del cliente al servidor
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  PLAYER_READY: 'playerReady',
  PLAYER_ACTION: 'playerAction',
  NEXT_HAND: 'nextHand',
  
  // Eventos del servidor al cliente
  ROOM_JOINED: 'roomJoined',
  ROOM_STATE: 'roomState',
  GAME_STATE: 'gameState',
  PLAYER_TURN: 'playerTurn',
  GAME_ERROR: 'gameError',
  GAME_MESSAGE: 'gameMessage',
  HAND_RESULT: 'handResult',
};

// Exportar las constantes
module.exports = {
  PORT,
  GAME_CONFIG,
  POKER_RULES,
  GAME_PHASES,
  PLAYER_ROLES,
  PLAYER_ACTIONS,
  SOCKET_EVENTS,
=======
/**
 * Constantes globales para la aplicación
 */

// Configuración del servidor
const PORT = process.env.PORT || 3000;

// Configuraciones del juego
const GAME_CONFIG = {
  DEFAULT_BALANCE: 2000,      // Balance inicial por defecto
  MIN_PLAYERS: 2,             // Mínimo número de jugadores para empezar
  MAX_PLAYERS: 8,             // Máximo número de jugadores por sala
  TIMEOUT_SECONDS: 30,        // Tiempo máximo para una acción
  MAX_INACTIVE_TIME: 300000,  // Tiempo máximo de inactividad (5 minutos)
};

// Reglas del juego
const POKER_RULES = {
  SMALL_BLIND: 1,             // Valor de la ciega pequeña
  BIG_BLIND: 2,               // Valor de la ciega grande
  MIN_BET: 2,                 // Apuesta mínima
  MAX_RAISE_MULTIPLIER: 4,    // Multiplicador máximo para subir apuesta
};

// Fases del juego
const GAME_PHASES = {
  WAITING: 'waiting',         // Esperando jugadores
  READY: 'ready',             // Jugadores listos para empezar
  PRE_FLOP: 'preFlop',        // Primera ronda de apuestas
  FLOP: 'flop',               // Segunda ronda de apuestas
  TURN: 'turn',               // Tercera ronda de apuestas
  RIVER: 'river',             // Ronda final de apuestas
  SHOWDOWN: 'showdown',       // Revelación de cartas
};

// Roles de jugadores
const PLAYER_ROLES = {
  DEALER: 'dealer',
  SMALL_BLIND: 'smallBlind',
  BIG_BLIND: 'bigBlind',
  PLAYER: 'player',
};

// Acciones de jugadores
const PLAYER_ACTIONS = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  BET: 'bet',
  RAISE: 'raise',
  ALL_IN: 'allIn',
};

// Eventos de Socket.IO
const SOCKET_EVENTS = {
  // Eventos del cliente al servidor
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  PLAYER_READY: 'playerReady',
  PLAYER_ACTION: 'playerAction',
  NEXT_HAND: 'nextHand',
  
  // Eventos del servidor al cliente
  ROOM_JOINED: 'roomJoined',
  ROOM_STATE: 'roomState',
  GAME_STATE: 'gameState',
  PLAYER_TURN: 'playerTurn',
  GAME_ERROR: 'gameError',
  GAME_MESSAGE: 'gameMessage',
  HAND_RESULT: 'handResult',
};

// Exportar las constantes
module.exports = {
  PORT,
  GAME_CONFIG,
  POKER_RULES,
  GAME_PHASES,
  PLAYER_ROLES,
  PLAYER_ACTIONS,
  SOCKET_EVENTS,
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
};