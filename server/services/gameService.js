<<<<<<< HEAD
/**
 * Servicio para gestionar la lógica del juego de póker
 * Proporciona funciones para gestionar acciones, estado del juego y flujo de las partidas
 */

const Game = require('../models/Game');
const roomService = require('./roomService');
const { GAME_PHASES, PLAYER_ACTIONS, GAME_CONFIG } = require('../config/constants');

// Almacén de juegos activos
const activeGames = {};

/**
 * Crea una nueva instancia de juego para una sala
 * @param {string} roomId - ID de la sala
 * @returns {Game} - Nueva instancia de juego
 */
function createGame(roomId) {
  const room = roomService.getRoom(roomId);
  
  if (!room) {
    throw new Error(`La sala ${roomId} no existe`);
  }
  
  // Crear juego y guardarlo en el almacén
  const game = new Game(roomId, room);
  activeGames[roomId] = game;
  
  // Configurar limpieza automática de juegos inactivos
  setupGameCleanup(roomId);
  
  return game;
}

/**
 * Obtiene una instancia de juego existente
 * @param {string} roomId - ID de la sala del juego
 * @returns {Game|null} - Instancia del juego o null si no existe
 */
function getGame(roomId) {
  return activeGames[roomId] || null;
}

/**
 * Elimina una instancia de juego
 * @param {string} roomId - ID de la sala del juego
 * @returns {boolean} - True si se eliminó correctamente
 */
function removeGame(roomId) {
  if (!activeGames[roomId]) {
    return false;
  }
  
  delete activeGames[roomId];
  return true;
}

/**
 * Inicia una nueva mano en el juego
 * @param {string} roomId - ID de la sala
 * @returns {Object} - Resultado de la operación
 */
function startNewHand(roomId) {
  let game = getGame(roomId);
  
  if (!game) {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Sala no encontrada' };
    }
    
    game = createGame(roomId);
  }
  
  try {
    // Verificar que los jugadores están listos
    const allReady = Object.values(game.room.players).every(player => player.isReady);
    
    if (!allReady) {
      return { 
        success: false, 
        error: 'No todos los jugadores están listos' 
      };
    }
    
    // Iniciar nueva mano
    const started = game.startNewHand();
    
    if (!started) {
      return { 
        success: false, 
        error: 'No se pudo iniciar la mano (posiblemente no hay suficientes jugadores)' 
      };
    }
    
    // Marcar que los jugadores han participado en una mano
    Object.values(game.room.players).forEach(player => {
      if (!player.folded) {
        player.playHand();
      }
    });
    
    return {
      success: true,
      gameState: game.getState(),
      currentTurn: game.currentTurn
    };
    
  } catch (error) {
    console.error('Error al iniciar nueva mano:', error);
    return { 
      success: false, 
      error: 'Error al iniciar nueva mano: ' + error.message 
    };
  }
}

/**
 * Procesa una acción de un jugador
 * @param {string} roomId - ID de la sala
 * @param {string} playerId - ID del jugador
 * @param {string} actionType - Tipo de acción
 * @param {number} amount - Cantidad para apuestas/subidas
 * @returns {Object} - Resultado de la acción
 */
function processPlayerAction(roomId, playerId, actionType, amount = 0) {
  const game = getGame(roomId);
  
  if (!game) {
    return { 
      success: false, 
      error: 'Juego no encontrado' 
    };
  }
  
  try {
    // Validar tipo de acción
    if (!Object.values(PLAYER_ACTIONS).includes(actionType)) {
      return { 
        success: false, 
        error: 'Tipo de acción no válido' 
      };
    }
    
    // Procesar la acción
    const result = game.processAction(playerId, actionType, amount);
    
    // Verificar si hemos llegado a showdown
    if (game.currentPhase === GAME_PHASES.SHOWDOWN) {
      return {
        success: true,
        result,
        gameState: game.getState(),
        showdown: true
      };
    }
    
    return {
      success: true,
      result,
      gameState: game.getState(),
      nextTurn: game.currentTurn
    };
    
  } catch (error) {
    console.error('Error al procesar acción:', error);
    return { 
      success: false, 
      error: 'Error al procesar acción: ' + error.message 
    };
  }
}

/**
 * Finaliza una mano y asigna el bote al ganador
 * @param {string} roomId - ID de la sala
 * @param {string} winnerId - ID del jugador ganador
 * @returns {Object} - Resultado de la operación
 */
function finishHand(roomId, winnerId) {
  const game = getGame(roomId);
  
  if (!game) {
    return { 
      success: false, 
      error: 'Juego no encontrado' 
    };
  }
  
  try {
    // Verificar que el ganador es válido
    if (!game.room.players[winnerId]) {
      return { 
        success: false, 
        error: 'Ganador no válido' 
      };
    }
    
    // Finalizar la mano
    const result = game.finishHand(winnerId);
    
    return {
      success: true,
      result,
      gameState: game.getState()
    };
    
  } catch (error) {
    console.error('Error al finalizar mano:', error);
    return { 
      success: false, 
      error: 'Error al finalizar mano: ' + error.message 
    };
  }
}

/**
 * Obtiene las opciones de acciones válidas para un jugador
 * @param {string} roomId - ID de la sala
 * @param {string} playerId - ID del jugador
 * @returns {Object} - Opciones disponibles para el jugador
 */
function getPlayerOptions(roomId, playerId) {
  const game = getGame(roomId);
  
  if (!game) {
    return {};
  }
  
  const player = game.room.players[playerId];
  
  if (!player) {
    return {};
  }
  
  const options = {};
  
  // Siempre se puede retirar
  options[PLAYER_ACTIONS.FOLD] = true;
  
  // Check/Pasar
  if (player.currentBet === game.currentBet) {
    options[PLAYER_ACTIONS.CHECK] = true;
  }
  
  // Call/Igualar
  const callAmount = game.currentBet - player.currentBet;
  if (callAmount > 0 && player.balance >= callAmount) {
    options[PLAYER_ACTIONS.CALL] = {
      amount: callAmount
    };
  }
  
  // Bet/Apostar
  if (game.currentBet === 0 && player.balance > 0) {
    options[PLAYER_ACTIONS.BET] = {
      min: GAME_CONFIG.MIN_BET,
      max: player.balance
    };
  }
  
  // Raise/Subir
  if (game.currentBet > 0 && player.balance > callAmount) {
    const minRaise = Math.min(game.currentBet * 2, player.balance);
    options[PLAYER_ACTIONS.RAISE] = {
      min: minRaise,
      max: player.balance
    };
  }
  
  // All-In
  if (player.balance > 0) {
    options[PLAYER_ACTIONS.ALL_IN] = {
      amount: player.balance
    };
  }
  
  return options;
}

/**
 * Verifica y maneja jugadores inactivos (timeout)
 * @param {string} roomId - ID de la sala
 * @returns {Object|null} - Resultado de la acción o null si no se tomó ninguna
 */
function handleInactivePlayers(roomId) {
  const game = getGame(roomId);
  
  if (!game || !game.currentTurn) {
    return null;
  }
  
  const currentPlayer = game.room.players[game.currentTurn];
  
  if (!currentPlayer) {
    // Avanzar turno si el jugador ya no existe
    game.nextTurn();
    return { type: 'next_turn', playerId: game.currentTurn };
  }
  
  // Verificar timeout
  const now = Date.now();
  const timeSinceLastAction = now - game.lastActionTime;
  
  if (timeSinceLastAction > GAME_CONFIG.TIMEOUT_SECONDS * 1000) {
    // Auto-fold por timeout
    try {
      const result = game.processAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
      
      return {
        type: 'timeout_fold',
        playerId: currentPlayer.id,
        result
      };
    } catch (error) {
      console.error('Error al procesar auto-fold:', error);
      game.nextTurn();
      return { type: 'next_turn', playerId: game.currentTurn };
    }
  }
  
  return null;
}

/**
 * Configura la limpieza automática de juegos inactivos
 * @param {string} roomId - ID de la sala
 */
function setupGameCleanup(roomId) {
  const checkInterval = 60000; // 1 minuto
  
  const intervalId = setInterval(() => {
    const game = activeGames[roomId];
    
    // Si el juego ya no existe, limpiar el intervalo
    if (!game) {
      clearInterval(intervalId);
      return;
    }
    
    // Verificar si el juego está inactivo
    const now = Date.now();
    const lastActivity = game.lastActionTime || now;
    const inactiveTime = now - lastActivity;
    
    // Si ha estado inactivo por más tiempo del permitido, eliminarlo
    if (inactiveTime > GAME_CONFIG.MAX_INACTIVE_TIME) {
      console.log(`Eliminando juego inactivo: ${roomId}`);
      removeGame(roomId);
      clearInterval(intervalId);
    }
  }, checkInterval);
}

/**
 * Obtiene estadísticas generales de todos los juegos
 * @returns {Object} - Estadísticas de los juegos
 */
function getGamesStats() {
  const totalGames = Object.keys(activeGames).length;
  let activePlayers = 0;
  let totalHands = 0;
  let activePhases = {
    waiting: 0,
    ready: 0,
    preFlop: 0,
    flop: 0,
    turn: 0,
    river: 0,
    showdown: 0
  };
  
  for (const roomId in activeGames) {
    const game = activeGames[roomId];
    
    // Contar jugadores activos
    activePlayers += game.getActivePlayers().length;
    
    // Contar manos jugadas
    totalHands += game.round;
    
    // Contar fases actuales
    if (activePhases.hasOwnProperty(game.currentPhase)) {
      activePhases[game.currentPhase]++;
    }
  }
  
  return {
    totalGames,
    activePlayers,
    totalHands,
    activePhases,
    avgPlayersPerGame: totalGames > 0 ? (activePlayers / totalGames).toFixed(2) : 0
  };
}

module.exports = {
  createGame,
  getGame,
  removeGame,
  startNewHand,
  processPlayerAction,
  finishHand,
  getPlayerOptions,
  handleInactivePlayers,
  getGamesStats
=======
/**
 * Servicio para gestionar la lógica del juego de póker
 * Proporciona funciones para gestionar acciones, estado del juego y flujo de las partidas
 */

const Game = require('../models/Game');
const roomService = require('./roomService');
const { GAME_PHASES, PLAYER_ACTIONS, GAME_CONFIG } = require('../config/constants');

// Almacén de juegos activos
const activeGames = {};

/**
 * Crea una nueva instancia de juego para una sala
 * @param {string} roomId - ID de la sala
 * @returns {Game} - Nueva instancia de juego
 */
function createGame(roomId) {
  const room = roomService.getRoom(roomId);
  
  if (!room) {
    throw new Error(`La sala ${roomId} no existe`);
  }
  
  // Crear juego y guardarlo en el almacén
  const game = new Game(roomId, room);
  activeGames[roomId] = game;
  
  // Configurar limpieza automática de juegos inactivos
  setupGameCleanup(roomId);
  
  return game;
}

/**
 * Obtiene una instancia de juego existente
 * @param {string} roomId - ID de la sala del juego
 * @returns {Game|null} - Instancia del juego o null si no existe
 */
function getGame(roomId) {
  return activeGames[roomId] || null;
}

/**
 * Elimina una instancia de juego
 * @param {string} roomId - ID de la sala del juego
 * @returns {boolean} - True si se eliminó correctamente
 */
function removeGame(roomId) {
  if (!activeGames[roomId]) {
    return false;
  }
  
  delete activeGames[roomId];
  return true;
}

/**
 * Inicia una nueva mano en el juego
 * @param {string} roomId - ID de la sala
 * @returns {Object} - Resultado de la operación
 */
function startNewHand(roomId) {
  let game = getGame(roomId);
  
  if (!game) {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Sala no encontrada' };
    }
    
    game = createGame(roomId);
  }
  
  try {
    // Verificar que los jugadores están listos
    const allReady = Object.values(game.room.players).every(player => player.isReady);
    
    if (!allReady) {
      return { 
        success: false, 
        error: 'No todos los jugadores están listos' 
      };
    }
    
    // Iniciar nueva mano
    const started = game.startNewHand();
    
    if (!started) {
      return { 
        success: false, 
        error: 'No se pudo iniciar la mano (posiblemente no hay suficientes jugadores)' 
      };
    }
    
    // Marcar que los jugadores han participado en una mano
    Object.values(game.room.players).forEach(player => {
      if (!player.folded) {
        player.playHand();
      }
    });
    
    return {
      success: true,
      gameState: game.getState(),
      currentTurn: game.currentTurn
    };
    
  } catch (error) {
    console.error('Error al iniciar nueva mano:', error);
    return { 
      success: false, 
      error: 'Error al iniciar nueva mano: ' + error.message 
    };
  }
}

/**
 * Procesa una acción de un jugador
 * @param {string} roomId - ID de la sala
 * @param {string} playerId - ID del jugador
 * @param {string} actionType - Tipo de acción
 * @param {number} amount - Cantidad para apuestas/subidas
 * @returns {Object} - Resultado de la acción
 */
function processPlayerAction(roomId, playerId, actionType, amount = 0) {
  const game = getGame(roomId);
  
  if (!game) {
    return { 
      success: false, 
      error: 'Juego no encontrado' 
    };
  }
  
  try {
    // Validar tipo de acción
    if (!Object.values(PLAYER_ACTIONS).includes(actionType)) {
      return { 
        success: false, 
        error: 'Tipo de acción no válido' 
      };
    }
    
    // Procesar la acción
    const result = game.processAction(playerId, actionType, amount);
    
    // Verificar si hemos llegado a showdown
    if (game.currentPhase === GAME_PHASES.SHOWDOWN) {
      return {
        success: true,
        result,
        gameState: game.getState(),
        showdown: true
      };
    }
    
    return {
      success: true,
      result,
      gameState: game.getState(),
      nextTurn: game.currentTurn
    };
    
  } catch (error) {
    console.error('Error al procesar acción:', error);
    return { 
      success: false, 
      error: 'Error al procesar acción: ' + error.message 
    };
  }
}

/**
 * Finaliza una mano y asigna el bote al ganador
 * @param {string} roomId - ID de la sala
 * @param {string} winnerId - ID del jugador ganador
 * @returns {Object} - Resultado de la operación
 */
function finishHand(roomId, winnerId) {
  const game = getGame(roomId);
  
  if (!game) {
    return { 
      success: false, 
      error: 'Juego no encontrado' 
    };
  }
  
  try {
    // Verificar que el ganador es válido
    if (!game.room.players[winnerId]) {
      return { 
        success: false, 
        error: 'Ganador no válido' 
      };
    }
    
    // Finalizar la mano
    const result = game.finishHand(winnerId);
    
    return {
      success: true,
      result,
      gameState: game.getState()
    };
    
  } catch (error) {
    console.error('Error al finalizar mano:', error);
    return { 
      success: false, 
      error: 'Error al finalizar mano: ' + error.message 
    };
  }
}

/**
 * Obtiene las opciones de acciones válidas para un jugador
 * @param {string} roomId - ID de la sala
 * @param {string} playerId - ID del jugador
 * @returns {Object} - Opciones disponibles para el jugador
 */
function getPlayerOptions(roomId, playerId) {
  const game = getGame(roomId);
  
  if (!game) {
    return {};
  }
  
  const player = game.room.players[playerId];
  
  if (!player) {
    return {};
  }
  
  const options = {};
  
  // Siempre se puede retirar
  options[PLAYER_ACTIONS.FOLD] = true;
  
  // Check/Pasar
  if (player.currentBet === game.currentBet) {
    options[PLAYER_ACTIONS.CHECK] = true;
  }
  
  // Call/Igualar
  const callAmount = game.currentBet - player.currentBet;
  if (callAmount > 0 && player.balance >= callAmount) {
    options[PLAYER_ACTIONS.CALL] = {
      amount: callAmount
    };
  }
  
  // Bet/Apostar
  if (game.currentBet === 0 && player.balance > 0) {
    options[PLAYER_ACTIONS.BET] = {
      min: GAME_CONFIG.MIN_BET,
      max: player.balance
    };
  }
  
  // Raise/Subir
  if (game.currentBet > 0 && player.balance > callAmount) {
    const minRaise = Math.min(game.currentBet * 2, player.balance);
    options[PLAYER_ACTIONS.RAISE] = {
      min: minRaise,
      max: player.balance
    };
  }
  
  // All-In
  if (player.balance > 0) {
    options[PLAYER_ACTIONS.ALL_IN] = {
      amount: player.balance
    };
  }
  
  return options;
}

/**
 * Verifica y maneja jugadores inactivos (timeout)
 * @param {string} roomId - ID de la sala
 * @returns {Object|null} - Resultado de la acción o null si no se tomó ninguna
 */
function handleInactivePlayers(roomId) {
  const game = getGame(roomId);
  
  if (!game || !game.currentTurn) {
    return null;
  }
  
  const currentPlayer = game.room.players[game.currentTurn];
  
  if (!currentPlayer) {
    // Avanzar turno si el jugador ya no existe
    game.nextTurn();
    return { type: 'next_turn', playerId: game.currentTurn };
  }
  
  // Verificar timeout
  const now = Date.now();
  const timeSinceLastAction = now - game.lastActionTime;
  
  if (timeSinceLastAction > GAME_CONFIG.TIMEOUT_SECONDS * 1000) {
    // Auto-fold por timeout
    try {
      const result = game.processAction(currentPlayer.id, PLAYER_ACTIONS.FOLD);
      
      return {
        type: 'timeout_fold',
        playerId: currentPlayer.id,
        result
      };
    } catch (error) {
      console.error('Error al procesar auto-fold:', error);
      game.nextTurn();
      return { type: 'next_turn', playerId: game.currentTurn };
    }
  }
  
  return null;
}

/**
 * Configura la limpieza automática de juegos inactivos
 * @param {string} roomId - ID de la sala
 */
function setupGameCleanup(roomId) {
  const checkInterval = 60000; // 1 minuto
  
  const intervalId = setInterval(() => {
    const game = activeGames[roomId];
    
    // Si el juego ya no existe, limpiar el intervalo
    if (!game) {
      clearInterval(intervalId);
      return;
    }
    
    // Verificar si el juego está inactivo
    const now = Date.now();
    const lastActivity = game.lastActionTime || now;
    const inactiveTime = now - lastActivity;
    
    // Si ha estado inactivo por más tiempo del permitido, eliminarlo
    if (inactiveTime > GAME_CONFIG.MAX_INACTIVE_TIME) {
      console.log(`Eliminando juego inactivo: ${roomId}`);
      removeGame(roomId);
      clearInterval(intervalId);
    }
  }, checkInterval);
}

/**
 * Obtiene estadísticas generales de todos los juegos
 * @returns {Object} - Estadísticas de los juegos
 */
function getGamesStats() {
  const totalGames = Object.keys(activeGames).length;
  let activePlayers = 0;
  let totalHands = 0;
  let activePhases = {
    waiting: 0,
    ready: 0,
    preFlop: 0,
    flop: 0,
    turn: 0,
    river: 0,
    showdown: 0
  };
  
  for (const roomId in activeGames) {
    const game = activeGames[roomId];
    
    // Contar jugadores activos
    activePlayers += game.getActivePlayers().length;
    
    // Contar manos jugadas
    totalHands += game.round;
    
    // Contar fases actuales
    if (activePhases.hasOwnProperty(game.currentPhase)) {
      activePhases[game.currentPhase]++;
    }
  }
  
  return {
    totalGames,
    activePlayers,
    totalHands,
    activePhases,
    avgPlayersPerGame: totalGames > 0 ? (activePlayers / totalGames).toFixed(2) : 0
  };
}

module.exports = {
  createGame,
  getGame,
  removeGame,
  startNewHand,
  processPlayerAction,
  finishHand,
  getPlayerOptions,
  handleInactivePlayers,
  getGamesStats
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
};