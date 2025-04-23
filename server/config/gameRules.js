/**
 * Reglas del juego de póker
 * Contiene la configuración específica y lógica relacionada con las reglas del juego
 */

const { GAME_PHASES, POKER_RULES } = require('./constants');

/**
 * Determina el orden de turnos según la fase del juego
 * @param {Array} playerIds - Array de IDs de jugadores en la mesa
 * @param {string} dealerId - ID del dealer
 * @param {string} phase - Fase actual del juego
 * @returns {Array} - Array ordenado de IDs de jugadores para la ronda
 */
function determineTurnOrder(playerIds, dealerId, phase) {
  if (!playerIds.length) return [];
  
  const dealerIndex = playerIds.indexOf(dealerId);
  if (dealerIndex === -1) return playerIds; // Protección por si no se encuentra el dealer
  
  // Determinar posición inicial según la fase
  let startIndex;
  
  // En PreFlop, comienza el jugador después de la ciega grande (3 posiciones después del dealer)
  if (phase === GAME_PHASES.PRE_FLOP) {
    startIndex = (dealerIndex + 3) % playerIds.length;
  } 
  // En cualquier otra fase, comienza el jugador después del dealer
  else {
    startIndex = (dealerIndex + 1) % playerIds.length;
  }
  
  // Reorganizar el array para que comience en la posición correcta
  const orderedIds = [];
  for (let i = 0; i < playerIds.length; i++) {
    const index = (startIndex + i) % playerIds.length;
    orderedIds.push(playerIds[index]);
  }
  
  return orderedIds;
}

/**
 * Calcula las posiciones de las ciegas basadas en la posición del dealer
 * @param {Array} playerIds - Array de IDs de jugadores en la mesa
 * @param {number} dealerIndex - Índice del dealer en el array
 * @returns {Object} - Objeto con índices de las ciegas
 */
function calculateBlindsPositions(playerIds, dealerIndex) {
  if (!playerIds.length) return { sbIndex: -1, bbIndex: -1 };
  
  const playerCount = playerIds.length;
  
  // En juegos con solo 2 jugadores, el dealer es la ciega pequeña
  if (playerCount === 2) {
    return {
      sbIndex: dealerIndex,
      bbIndex: (dealerIndex + 1) % playerCount
    };
  }
  
  // En juegos con más jugadores, la ciega pequeña está a la izquierda del dealer
  return {
    sbIndex: (dealerIndex + 1) % playerCount,
    bbIndex: (dealerIndex + 2) % playerCount
  };
}

/**
 * Determina si una apuesta es válida según las reglas
 * @param {number} amount - Cantidad a apostar
 * @param {number} currentBet - Apuesta actual en la mesa
 * @param {number} playerBalance - Balance del jugador
 * @param {string} actionType - Tipo de acción (bet, raise)
 * @returns {Object} - Objeto con validez y mensaje de error si aplica
 */
function isValidBet(amount, currentBet, playerBalance, actionType) {
  // Verificar que el jugador tiene suficiente balance
  if (amount > playerBalance) {
    return {
      valid: false,
      message: 'No tienes suficiente balance para esta apuesta'
    };
  }
  
  // Reglas específicas según el tipo de acción
  if (actionType === 'bet') {
    // Para apostar, debe ser al menos la ciega grande
    if (amount < POKER_RULES.MIN_BET) {
      return {
        valid: false,
        message: `La apuesta mínima es ${POKER_RULES.MIN_BET}`
      };
    }
  } else if (actionType === 'raise') {
    // Para subir, debe ser al menos el doble de la apuesta actual
    const minRaise = currentBet * 2;
    if (amount < minRaise) {
      return {
        valid: false,
        message: `La subida mínima es ${minRaise}`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Determina la siguiente fase del juego
 * @param {string} currentPhase - Fase actual
 * @returns {string} - Siguiente fase o null si es la última
 */
function getNextPhase(currentPhase) {
  const phases = [
    GAME_PHASES.WAITING,
    GAME_PHASES.READY,
    GAME_PHASES.PRE_FLOP,
    GAME_PHASES.FLOP,
    GAME_PHASES.TURN,
    GAME_PHASES.RIVER,
    GAME_PHASES.SHOWDOWN
  ];
  
  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return null;
  }
  
  return phases[currentIndex + 1];
}

/**
 * Determina si todos los jugadores han igualado la apuesta
 * @param {Object} players - Objeto de jugadores
 * @param {number} currentBet - Apuesta actual
 * @returns {boolean} - True si todos han igualado
 */
function allPlayersActedOrAllin(players, currentBet) {
  return Object.values(players).every(player => {
    // Un jugador ha cumplido si:
    // - Se ha retirado
    // - Ha ido all-in (balance = 0)
    // - Ha igualado la apuesta actual
    return player.folded || 
           player.balance === 0 || 
           player.currentBet === currentBet;
  });
}

module.exports = {
  determineTurnOrder,
  calculateBlindsPositions,
  isValidBet,
  getNextPhase,
  allPlayersActedOrAllin
};