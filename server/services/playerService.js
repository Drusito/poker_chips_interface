<<<<<<< HEAD
/**
 * Servicio para gestionar jugadores
 * Proporciona funciones para crear, actualizar y gestionar jugadores
 */

const Player = require('../models/Player');
const { GAME_CONFIG } = require('../config/constants');

/**
 * Crea un nuevo jugador
 * @param {string} id - ID del socket del jugador
 * @param {string} name - Nombre del jugador
 * @param {number} balance - Balance inicial (opcional)
 * @returns {Player} - Nuevo objeto de jugador
 */
function createPlayer(id, name, balance = GAME_CONFIG.DEFAULT_BALANCE) {
  // Validar datos de entrada
  if (!id || !name) {
    throw new Error('ID y nombre son requeridos para crear un jugador');
  }
  
  // Validar balance
  if (balance <= 0) {
    balance = GAME_CONFIG.DEFAULT_BALANCE;
  }
  
  // Crear nuevo jugador
  return new Player(id, name, balance);
}

/**
 * Actualiza datos de un jugador
 * @param {Player} player - Objeto jugador a actualizar
 * @param {Object} data - Datos a actualizar
 * @returns {Player} - Jugador actualizado
 */
function updatePlayer(player, data) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  // Actualizar datos permitidos
  player.updateFromData(data);
  
  return player;
}

/**
 * Añade fondos al balance de un jugador
 * @param {Player} player - Objeto jugador
 * @param {number} amount - Cantidad a añadir
 * @returns {number} - Nuevo balance
 */
function addFunds(player, amount) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  if (amount <= 0) {
    throw new Error('La cantidad debe ser positiva');
  }
  
  return player.addFunds(amount);
}

/**
 * Marca a un jugador como listo/no listo
 * @param {Player} player - Objeto jugador
 * @param {boolean} status - Estado de listo
 * @returns {Player} - Jugador actualizado
 */
function setPlayerReady(player, status = true) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  player.setReady(status);
  return player;
}

/**
 * Actualiza el estado de conexión de un jugador
 * @param {Player} player - Objeto jugador
 * @param {boolean} connected - Estado de conexión
 * @returns {Player} - Jugador actualizado
 */
function setPlayerConnected(player, connected = true) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  player.setConnected(connected);
  return player;
}

/**
 * Verifica si un jugador puede actuar en el juego
 * @param {Player} player - Objeto jugador
 * @returns {boolean} - True si puede actuar
 */
function canPlayerAct(player) {
  if (!player) {
    return false;
  }
  
  return player.canAct();
}

/**
 * Obtiene los datos de un jugador para enviar al cliente
 * @param {Player} player - Objeto jugador
 * @returns {Object} - Datos del jugador para el cliente
 */
function getPlayerClientData(player) {
  if (!player) {
    return null;
  }
  
  return player.toClientData();
}

/**
 * Actualiza las estadísticas de un jugador
 * @param {Player} player - Objeto jugador
 * @param {string} statType - Tipo de estadística (handsPlayed, handsWon, etc)
 * @param {number} value - Valor a añadir o establecer
 * @returns {Object} - Estadísticas actualizadas
 */
function updatePlayerStats(player, statType, value) {
  if (!player || !player.stats || !statType) {
    return null;
  }
  
  // Verificar si la estadística existe
  if (!player.stats.hasOwnProperty(statType)) {
    return player.stats;
  }
  
  // Actualizar estadística
  if (typeof value === 'number') {
    // Si es número, sumarlo al valor actual
    player.stats[statType] += value;
  } else {
    // De lo contrario, establecer el valor directamente
    player.stats[statType] = value;
  }
  
  return player.stats;
}

/**
 * Resetea a un jugador para una nueva mano
 * @param {Player} player - Objeto jugador
 * @returns {Player} - Jugador reseteado
 */
function resetPlayerForNewHand(player) {
  if (!player) {
    return null;
  }
  
  player.resetForNewHand();
  return player;
}

/**
 * Procesa una acción de fold (retirarse) para un jugador
 * @param {Player} player - Objeto jugador
 * @returns {boolean} - True si se procesó correctamente
 */
function foldPlayer(player) {
  if (!player || player.folded) {
    return false;
  }
  
  player.folded = true;
  player.lastAction = 'fold';
  player.lastActionTime = Date.now();
  
  return true;
}

/**
 * Obtiene el tiempo desde la última acción de un jugador
 * @param {Player} player - Objeto jugador
 * @returns {number} - Tiempo en milisegundos
 */
function getPlayerIdleTime(player) {
  if (!player) {
    return Infinity;
  }
  
  return player.getTimeSinceLastAction() || 0;
}

module.exports = {
  createPlayer,
  updatePlayer,
  addFunds,
  setPlayerReady,
  setPlayerConnected,
  canPlayerAct,
  getPlayerClientData,
  updatePlayerStats,
  resetPlayerForNewHand,
  foldPlayer,
  getPlayerIdleTime
=======
/**
 * Servicio para gestionar jugadores
 * Proporciona funciones para crear, actualizar y gestionar jugadores
 */

const Player = require('../models/Player');
const { GAME_CONFIG } = require('../config/constants');

/**
 * Crea un nuevo jugador
 * @param {string} id - ID del socket del jugador
 * @param {string} name - Nombre del jugador
 * @param {number} balance - Balance inicial (opcional)
 * @returns {Player} - Nuevo objeto de jugador
 */
function createPlayer(id, name, balance = GAME_CONFIG.DEFAULT_BALANCE) {
  // Validar datos de entrada
  if (!id || !name) {
    throw new Error('ID y nombre son requeridos para crear un jugador');
  }
  
  // Validar balance
  if (balance <= 0) {
    balance = GAME_CONFIG.DEFAULT_BALANCE;
  }
  
  // Crear nuevo jugador
  return new Player(id, name, balance);
}

/**
 * Actualiza datos de un jugador
 * @param {Player} player - Objeto jugador a actualizar
 * @param {Object} data - Datos a actualizar
 * @returns {Player} - Jugador actualizado
 */
function updatePlayer(player, data) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  // Actualizar datos permitidos
  player.updateFromData(data);
  
  return player;
}

/**
 * Añade fondos al balance de un jugador
 * @param {Player} player - Objeto jugador
 * @param {number} amount - Cantidad a añadir
 * @returns {number} - Nuevo balance
 */
function addFunds(player, amount) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  if (amount <= 0) {
    throw new Error('La cantidad debe ser positiva');
  }
  
  return player.addFunds(amount);
}

/**
 * Marca a un jugador como listo/no listo
 * @param {Player} player - Objeto jugador
 * @param {boolean} status - Estado de listo
 * @returns {Player} - Jugador actualizado
 */
function setPlayerReady(player, status = true) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  player.setReady(status);
  return player;
}

/**
 * Actualiza el estado de conexión de un jugador
 * @param {Player} player - Objeto jugador
 * @param {boolean} connected - Estado de conexión
 * @returns {Player} - Jugador actualizado
 */
function setPlayerConnected(player, connected = true) {
  if (!player) {
    throw new Error('Jugador no válido');
  }
  
  player.setConnected(connected);
  return player;
}

/**
 * Verifica si un jugador puede actuar en el juego
 * @param {Player} player - Objeto jugador
 * @returns {boolean} - True si puede actuar
 */
function canPlayerAct(player) {
  if (!player) {
    return false;
  }
  
  return player.canAct();
}

/**
 * Obtiene los datos de un jugador para enviar al cliente
 * @param {Player} player - Objeto jugador
 * @returns {Object} - Datos del jugador para el cliente
 */
function getPlayerClientData(player) {
  if (!player) {
    return null;
  }
  
  return player.toClientData();
}

/**
 * Actualiza las estadísticas de un jugador
 * @param {Player} player - Objeto jugador
 * @param {string} statType - Tipo de estadística (handsPlayed, handsWon, etc)
 * @param {number} value - Valor a añadir o establecer
 * @returns {Object} - Estadísticas actualizadas
 */
function updatePlayerStats(player, statType, value) {
  if (!player || !player.stats || !statType) {
    return null;
  }
  
  // Verificar si la estadística existe
  if (!player.stats.hasOwnProperty(statType)) {
    return player.stats;
  }
  
  // Actualizar estadística
  if (typeof value === 'number') {
    // Si es número, sumarlo al valor actual
    player.stats[statType] += value;
  } else {
    // De lo contrario, establecer el valor directamente
    player.stats[statType] = value;
  }
  
  return player.stats;
}

/**
 * Resetea a un jugador para una nueva mano
 * @param {Player} player - Objeto jugador
 * @returns {Player} - Jugador reseteado
 */
function resetPlayerForNewHand(player) {
  if (!player) {
    return null;
  }
  
  player.resetForNewHand();
  return player;
}

/**
 * Procesa una acción de fold (retirarse) para un jugador
 * @param {Player} player - Objeto jugador
 * @returns {boolean} - True si se procesó correctamente
 */
function foldPlayer(player) {
  if (!player || player.folded) {
    return false;
  }
  
  player.folded = true;
  player.lastAction = 'fold';
  player.lastActionTime = Date.now();
  
  return true;
}

/**
 * Obtiene el tiempo desde la última acción de un jugador
 * @param {Player} player - Objeto jugador
 * @returns {number} - Tiempo en milisegundos
 */
function getPlayerIdleTime(player) {
  if (!player) {
    return Infinity;
  }
  
  return player.getTimeSinceLastAction() || 0;
}

module.exports = {
  createPlayer,
  updatePlayer,
  addFunds,
  setPlayerReady,
  setPlayerConnected,
  canPlayerAct,
  getPlayerClientData,
  updatePlayerStats,
  resetPlayerForNewHand,
  foldPlayer,
  getPlayerIdleTime
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
};