<<<<<<< HEAD
/**
 * Utilidades para el juego de póker
 * Funciones auxiliares y helpers para la lógica del juego
 */

/**
 * Genera un ID aleatorio para una sala
 * @param {number} length - Longitud del ID (por defecto 6)
 * @returns {string} - ID generado
 */
function generateRoomId(length = 6) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
  
  /**
   * Convierte una lista de jugadores a un formato adecuado para el cliente
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @returns {Object} - Objeto con datos de jugadores para el cliente
   */
  function playersToClientFormat(players) {
    const result = {};
    
    for (const id in players) {
      result[id] = players[id].toClientData();
    }
    
    return result;
  }
  
  /**
   * Encuentra jugadores por rol
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @param {string} role - Rol a buscar
   * @returns {Array} - Lista de jugadores con ese rol
   */
  function findPlayersByRole(players, role) {
    const result = [];
    
    for (const id in players) {
      if (players[id].role === role) {
        result.push(players[id]);
      }
    }
    
    return result;
  }
  
  /**
   * Calcula la distribución de asientos alrededor de una mesa
   * @param {number} playerCount - Número de jugadores
   * @returns {Array} - Array de posiciones {x, y} normalizadas (0-1)
   */
  function calculateTablePositions(playerCount) {
    const positions = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.4;
    
    // Calcular posiciones en círculo
    for (let i = 0; i < playerCount; i++) {
      // Ángulo en radianes (empezando desde arriba y en sentido horario)
      const angle = (Math.PI * 2 * i / playerCount) - Math.PI / 2;
      
      // Calcular posición
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      positions.push({ x, y });
    }
    
    return positions;
  }
  
  /**
   * Valida un nombre de jugador
   * @param {string} name - Nombre a validar
   * @returns {Object} - Objeto con validez y mensaje de error si aplica
   */
  function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        message: 'El nombre es requerido'
      };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      return {
        valid: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      };
    }
    
    if (trimmedName.length > 20) {
      return {
        valid: false,
        message: 'El nombre no puede tener más de 20 caracteres'
      };
    }
    
    // Verificar caracteres válidos (letras, números, espacios y algunos símbolos)
    const validPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s._-]+$/;
    if (!validPattern.test(trimmedName)) {
      return {
        valid: false,
        message: 'El nombre contiene caracteres no permitidos'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Formatea un valor de moneda
   * @param {number} value - Valor a formatear
   * @param {string} currency - Símbolo de moneda (por defecto €)
   * @returns {string} - Valor formateado
   */
  function formatCurrency(value, currency = '€') {
    return value.toLocaleString() + currency;
  }
  
  /**
   * Encuentra el jugador con la mayor apuesta en la mesa
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @returns {Object} - Jugador con la mayor apuesta
   */
  function findHighestBettor(players) {
    let highestBet = 0;
    let highestBettor = null;
    
    for (const id in players) {
      const player = players[id];
      if (player.currentBet > highestBet) {
        highestBet = player.currentBet;
        highestBettor = player;
      }
    }
    
    return highestBettor;
  }
  
  /**
   * Calcula el tiempo restante para un turno
   * @param {number} lastActionTime - Timestamp de la última acción
   * @param {number} timeLimit - Límite de tiempo en segundos
   * @returns {number} - Tiempo restante en segundos
   */
  function calculateRemainingTime(lastActionTime, timeLimit) {
    const elapsed = (Date.now() - lastActionTime) / 1000;
    return Math.max(0, timeLimit - elapsed);
  }
  
  /**
   * Genera un mensaje de estado del juego
   * @param {Object} game - Objeto del juego
   * @returns {string} - Mensaje descriptivo
   */
  function generateGameStatusMessage(game) {
    if (!game) return 'Juego no disponible';
    
    const phase = game.currentPhase;
    const pot = formatCurrency(game.pot);
    const currentBet = formatCurrency(game.currentBet);
    const activePlayers = game.getActivePlayers().length;
    
    let message = '';
    
    switch (phase) {
      case 'waiting':
        message = `Esperando jugadores (${activePlayers}/${game.room.players.length})`;
        break;
      case 'ready':
        message = 'Jugadores listos. Iniciando partida...';
        break;
      case 'preFlop':
        message = `Pre-Flop - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'flop':
        message = `Flop - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'turn':
        message = `Turn - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'river':
        message = `River - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'showdown':
        message = `Showdown - Bote final: ${pot}`;
        break;
      default:
        message = `Partida en curso - Bote: ${pot}`;
    }
    
    if (game.currentTurn) {
      const currentPlayer = game.room.players[game.currentTurn];
      if (currentPlayer) {
        message += ` - Turno de: ${currentPlayer.name}`;
      }
    }
    
    return message;
  }
  
  /**
   * Obtiene las estadísticas de la partida actual
   * @param {Object} game - Objeto del juego
   * @returns {Object} - Estadísticas del juego
   */
  function getGameStats(game) {
    if (!game) return null;
    
    const players = game.room.players;
    const activePlayers = game.getActivePlayers();
    let totalBalance = 0;
    let highestBalance = 0;
    let highestBalancePlayer = null;
    let totalBets = 0;
    
    // Calcular estadísticas
    for (const id in players) {
      const player = players[id];
      totalBalance += player.balance;
      totalBets += player.stats.totalBets;
      
      if (player.balance > highestBalance) {
        highestBalance = player.balance;
        highestBalancePlayer = player;
      }
    }
    
    return {
      round: game.round,
      activePlayers: activePlayers.length,
      totalPlayers: Object.keys(players).length,
      pot: game.pot,
      totalBalance,
      avgBalance: Object.keys(players).length > 0 ? (totalBalance / Object.keys(players).length).toFixed(2) : 0,
      highestBalance: highestBalance,
      highestBalancePlayer: highestBalancePlayer ? highestBalancePlayer.name : null,
      totalBets,
      phase: game.currentPhase
    };
  }
  
  module.exports = {
    generateRoomId,
    playersToClientFormat,
    findPlayersByRole,
    calculateTablePositions,
    validatePlayerName,
    formatCurrency,
    findHighestBettor,
    calculateRemainingTime,
    generateGameStatusMessage,
    getGameStats
=======
/**
 * Utilidades para el juego de póker
 * Funciones auxiliares y helpers para la lógica del juego
 */

/**
 * Genera un ID aleatorio para una sala
 * @param {number} length - Longitud del ID (por defecto 6)
 * @returns {string} - ID generado
 */
function generateRoomId(length = 6) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
  
  /**
   * Convierte una lista de jugadores a un formato adecuado para el cliente
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @returns {Object} - Objeto con datos de jugadores para el cliente
   */
  function playersToClientFormat(players) {
    const result = {};
    
    for (const id in players) {
      result[id] = players[id].toClientData();
    }
    
    return result;
  }
  
  /**
   * Encuentra jugadores por rol
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @param {string} role - Rol a buscar
   * @returns {Array} - Lista de jugadores con ese rol
   */
  function findPlayersByRole(players, role) {
    const result = [];
    
    for (const id in players) {
      if (players[id].role === role) {
        result.push(players[id]);
      }
    }
    
    return result;
  }
  
  /**
   * Calcula la distribución de asientos alrededor de una mesa
   * @param {number} playerCount - Número de jugadores
   * @returns {Array} - Array de posiciones {x, y} normalizadas (0-1)
   */
  function calculateTablePositions(playerCount) {
    const positions = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.4;
    
    // Calcular posiciones en círculo
    for (let i = 0; i < playerCount; i++) {
      // Ángulo en radianes (empezando desde arriba y en sentido horario)
      const angle = (Math.PI * 2 * i / playerCount) - Math.PI / 2;
      
      // Calcular posición
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      positions.push({ x, y });
    }
    
    return positions;
  }
  
  /**
   * Valida un nombre de jugador
   * @param {string} name - Nombre a validar
   * @returns {Object} - Objeto con validez y mensaje de error si aplica
   */
  function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        message: 'El nombre es requerido'
      };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      return {
        valid: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      };
    }
    
    if (trimmedName.length > 20) {
      return {
        valid: false,
        message: 'El nombre no puede tener más de 20 caracteres'
      };
    }
    
    // Verificar caracteres válidos (letras, números, espacios y algunos símbolos)
    const validPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s._-]+$/;
    if (!validPattern.test(trimmedName)) {
      return {
        valid: false,
        message: 'El nombre contiene caracteres no permitidos'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Formatea un valor de moneda
   * @param {number} value - Valor a formatear
   * @param {string} currency - Símbolo de moneda (por defecto €)
   * @returns {string} - Valor formateado
   */
  function formatCurrency(value, currency = '€') {
    return value.toLocaleString() + currency;
  }
  
  /**
   * Encuentra el jugador con la mayor apuesta en la mesa
   * @param {Object} players - Objeto con jugadores indexados por ID
   * @returns {Object} - Jugador con la mayor apuesta
   */
  function findHighestBettor(players) {
    let highestBet = 0;
    let highestBettor = null;
    
    for (const id in players) {
      const player = players[id];
      if (player.currentBet > highestBet) {
        highestBet = player.currentBet;
        highestBettor = player;
      }
    }
    
    return highestBettor;
  }
  
  /**
   * Calcula el tiempo restante para un turno
   * @param {number} lastActionTime - Timestamp de la última acción
   * @param {number} timeLimit - Límite de tiempo en segundos
   * @returns {number} - Tiempo restante en segundos
   */
  function calculateRemainingTime(lastActionTime, timeLimit) {
    const elapsed = (Date.now() - lastActionTime) / 1000;
    return Math.max(0, timeLimit - elapsed);
  }
  
  /**
   * Genera un mensaje de estado del juego
   * @param {Object} game - Objeto del juego
   * @returns {string} - Mensaje descriptivo
   */
  function generateGameStatusMessage(game) {
    if (!game) return 'Juego no disponible';
    
    const phase = game.currentPhase;
    const pot = formatCurrency(game.pot);
    const currentBet = formatCurrency(game.currentBet);
    const activePlayers = game.getActivePlayers().length;
    
    let message = '';
    
    switch (phase) {
      case 'waiting':
        message = `Esperando jugadores (${activePlayers}/${game.room.players.length})`;
        break;
      case 'ready':
        message = 'Jugadores listos. Iniciando partida...';
        break;
      case 'preFlop':
        message = `Pre-Flop - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'flop':
        message = `Flop - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'turn':
        message = `Turn - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'river':
        message = `River - Bote: ${pot}, Apuesta: ${currentBet}`;
        break;
      case 'showdown':
        message = `Showdown - Bote final: ${pot}`;
        break;
      default:
        message = `Partida en curso - Bote: ${pot}`;
    }
    
    if (game.currentTurn) {
      const currentPlayer = game.room.players[game.currentTurn];
      if (currentPlayer) {
        message += ` - Turno de: ${currentPlayer.name}`;
      }
    }
    
    return message;
  }
  
  /**
   * Obtiene las estadísticas de la partida actual
   * @param {Object} game - Objeto del juego
   * @returns {Object} - Estadísticas del juego
   */
  function getGameStats(game) {
    if (!game) return null;
    
    const players = game.room.players;
    const activePlayers = game.getActivePlayers();
    let totalBalance = 0;
    let highestBalance = 0;
    let highestBalancePlayer = null;
    let totalBets = 0;
    
    // Calcular estadísticas
    for (const id in players) {
      const player = players[id];
      totalBalance += player.balance;
      totalBets += player.stats.totalBets;
      
      if (player.balance > highestBalance) {
        highestBalance = player.balance;
        highestBalancePlayer = player;
      }
    }
    
    return {
      round: game.round,
      activePlayers: activePlayers.length,
      totalPlayers: Object.keys(players).length,
      pot: game.pot,
      totalBalance,
      avgBalance: Object.keys(players).length > 0 ? (totalBalance / Object.keys(players).length).toFixed(2) : 0,
      highestBalance: highestBalance,
      highestBalancePlayer: highestBalancePlayer ? highestBalancePlayer.name : null,
      totalBets,
      phase: game.currentPhase
    };
  }
  
  module.exports = {
    generateRoomId,
    playersToClientFormat,
    findPlayersByRole,
    calculateTablePositions,
    validatePlayerName,
    formatCurrency,
    findHighestBettor,
    calculateRemainingTime,
    generateGameStatusMessage,
    getGameStats
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
  };