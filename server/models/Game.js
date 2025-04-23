/**
 * Clase que representa una partida de póker
 * Gestiona la lógica principal del juego y el estado de la partida
 */

const { 
    GAME_PHASES, 
    POKER_RULES, 
    PLAYER_ROLES 
  } = require('../config/constants');
  const gameRules = require('../config/gameRules');
  
  class Game {
    /**
     * Constructor de la partida
     * @param {string} id - Identificador único de la partida
     * @param {Object} room - Referencia a la sala donde se juega
     */
    constructor(id, room) {
      this.id = id;
      this.room = room;
      this.currentPhase = GAME_PHASES.WAITING;
      this.pot = 0;
      this.currentBet = 0;
      this.dealerIndex = 0;
      this.currentTurn = null;
      this.lastActionTime = Date.now();
      this.round = 0; // Contador de manos jugadas
      this.history = []; // Historial de acciones en la mano actual
      this.communityCards = []; // Cartas comunitarias (no implementadas en esta versión)
      this.activePlayers = []; // Jugadores activos en la mano actual
    }
  
    /**
     * Inicia una nueva mano
     */
    startNewHand() {
      // Incrementar contador de rondas
      this.round++;
      
      // Resetear estado de la mano
      this.pot = 0;
      this.currentBet = 0;
      this.currentPhase = GAME_PHASES.READY;
      this.history = [];
      this.communityCards = [];
      
      // Obtener jugadores activos (no retirados ni sin balance)
      this.activePlayers = Object.keys(this.room.players).filter(id => {
        const player = this.room.players[id];
        return player.balance > 0 && player.connected;
      });
      
      // Verificar si hay suficientes jugadores
      if (this.activePlayers.length < 2) {
        return false;
      }
      
      // Asignar roles (dealer, SB, BB)
      this.assignRoles();
      
      // Resetear estado de los jugadores para la nueva mano
      this.resetPlayersForNewHand();
      
      // Cobrar ciegas
      this.collectBlinds();
      
      // Iniciar primera fase de apuestas
      this.currentPhase = GAME_PHASES.PRE_FLOP;
      
      // Determinar el primer jugador en actuar
      this.setFirstTurn();
      
      return true;
    }
  
    /**
     * Asigna los roles a los jugadores (dealer, SB, BB)
     */
    assignRoles() {
      // Calcular posiciones de las ciegas
      const { sbIndex, bbIndex } = gameRules.calculateBlindsPositions(
        this.activePlayers, 
        this.dealerIndex
      );
      
      // Resetear roles de todos los jugadores
      Object.values(this.room.players).forEach(player => {
        player.role = null;
      });
      
      // Asignar nuevos roles
      const dealerId = this.activePlayers[this.dealerIndex];
      const sbId = this.activePlayers[sbIndex];
      const bbId = this.activePlayers[bbIndex];
      
      this.room.players[dealerId].role = PLAYER_ROLES.DEALER;
      this.room.players[sbId].role = PLAYER_ROLES.SMALL_BLIND;
      this.room.players[bbId].role = PLAYER_ROLES.BIG_BLIND;
      
      return { dealerId, sbId, bbId };
    }
  
    /**
     * Resetea el estado de los jugadores para una nueva mano
     */
    resetPlayersForNewHand() {
      Object.values(this.room.players).forEach(player => {
        player.folded = false;
        player.currentBet = 0;
        player.lastAction = null;
      });
    }
  
    /**
     * Cobra las ciegas a los jugadores correspondientes
     */
    collectBlinds() {
      // Encontrar jugadores con roles de ciegas
      const smallBlindPlayer = Object.values(this.room.players).find(
        player => player.role === PLAYER_ROLES.SMALL_BLIND
      );
      
      const bigBlindPlayer = Object.values(this.room.players).find(
        player => player.role === PLAYER_ROLES.BIG_BLIND
      );
      
      if (!smallBlindPlayer || !bigBlindPlayer) {
        return false;
      }
      
      // Cobrar ciega pequeña
      const sbAmount = Math.min(POKER_RULES.SMALL_BLIND, smallBlindPlayer.balance);
      smallBlindPlayer.placeBet(sbAmount);
      smallBlindPlayer.lastAction = 'blind';
      
      // Cobrar ciega grande
      const bbAmount = Math.min(POKER_RULES.BIG_BLIND, bigBlindPlayer.balance);
      bigBlindPlayer.placeBet(bbAmount);
      bigBlindPlayer.lastAction = 'blind';
      
      // Establecer apuesta actual
      this.currentBet = bbAmount;
      
      // Registrar en el historial
      this.history.push({
        type: 'blinds',
        sb: {
          playerId: smallBlindPlayer.id,
          amount: sbAmount
        },
        bb: {
          playerId: bigBlindPlayer.id,
          amount: bbAmount
        },
        timestamp: Date.now()
      });
      
      return true;
    }
  
    /**
     * Establece el primer turno de la ronda
     */
    setFirstTurn() {
      // Ordenar jugadores según la fase
      const orderedPlayers = gameRules.determineTurnOrder(
        this.activePlayers,
        this.getPlayerByRole(PLAYER_ROLES.DEALER)?.id,
        this.currentPhase
      );
      
      // Encontrar el primer jugador activo
      for (const playerId of orderedPlayers) {
        const player = this.room.players[playerId];
        if (player && !player.folded && player.balance > 0) {
          this.currentTurn = playerId;
          this.lastActionTime = Date.now();
          return playerId;
        }
      }
      
      // Si no hay jugadores activos, avanzar a la siguiente fase
      this.nextPhase();
      return null;
    }
  
    /**
     * Avanza al siguiente jugador
     */
    nextTurn() {
      // Si solo queda un jugador, terminamos la mano
      const activePlayers = this.getActivePlayers();
      if (activePlayers.length <= 1) {
        this.currentPhase = GAME_PHASES.SHOWDOWN;
        return null;
      }
      
      // Buscar la posición del jugador actual
      const currentIndex = this.activePlayers.indexOf(this.currentTurn);
      if (currentIndex === -1) {
        return this.setFirstTurn();
      }
      
      // Buscar al siguiente jugador activo
      for (let i = 1; i <= this.activePlayers.length; i++) {
        const nextIndex = (currentIndex + i) % this.activePlayers.length;
        const nextPlayerId = this.activePlayers[nextIndex];
        const nextPlayer = this.room.players[nextPlayerId];
        
        if (nextPlayer && !nextPlayer.folded && nextPlayer.balance > 0) {
          this.currentTurn = nextPlayerId;
          this.lastActionTime = Date.now();
          return nextPlayerId;
        }
      }
      
      // Si todos han actuado y las apuestas están igualadas, avanzar a la siguiente fase
      if (this.allBetsEqualized()) {
        return this.nextPhase();
      }
      
      return null;
    }
  
    /**
     * Avanza a la siguiente fase del juego
     */
    nextPhase() {
      // Recolectar apuestas al bote
      this.collectBets();
      
      // Actualizar fase
      const nextPhase = gameRules.getNextPhase(this.currentPhase);
      
      // Si no hay siguiente fase o estamos en showdown, terminar
      if (!nextPhase || this.currentPhase === GAME_PHASES.SHOWDOWN) {
        this.currentPhase = GAME_PHASES.SHOWDOWN;
        return null;
      }
      
      // Actualizar a la siguiente fase
      this.currentPhase = nextPhase;
      
      // Resetear apuestas para la nueva fase
      this.currentBet = 0;
      Object.values(this.room.players).forEach(player => {
        player.currentBet = 0;
      });
      
      // Registrar en el historial
      this.history.push({
        type: 'phase_change',
        phase: this.currentPhase,
        timestamp: Date.now()
      });
      
      // Establecer primer turno de la nueva fase
      return this.setFirstTurn();
    }
  
    /**
     * Procesa una acción de un jugador
     * @param {string} playerId - ID del jugador
     * @param {string} actionType - Tipo de acción
     * @param {number} amount - Cantidad (para apuestas)
     * @returns {Object} - Resultado de la acción
     */
    processAction(playerId, actionType, amount = 0) {
      // Verificar que es el turno del jugador
      if (playerId !== this.currentTurn) {
        throw new Error('No es el turno de este jugador');
      }
      
      const player = this.room.players[playerId];
      
      if (!player) {
        throw new Error('Jugador no encontrado');
      }
      
      // Crear registro de acción para el historial
      const actionRecord = {
        type: 'action',
        playerId,
        actionType,
        amount,
        timestamp: Date.now()
      };
      
      // Procesar según tipo de acción
      switch (actionType) {
        case 'fold':
          player.folded = true;
          player.lastAction = 'fold';
          break;
          
        case 'check':
          // Verificar que puede pasar
          if (player.currentBet < this.currentBet) {
            throw new Error('No puedes pasar, debes igualar o retirarte');
          }
          player.lastAction = 'check';
          break;
          
        case 'call':
          // Calcular cantidad a igualar
          const callAmount = Math.min(
            this.currentBet - player.currentBet,
            player.balance
          );
          
          if (callAmount <= 0) {
            throw new Error('No hay apuesta que igualar');
          }
          
          player.placeBet(callAmount);
          player.lastAction = 'call';
          actionRecord.amount = callAmount;
          break;
          
        case 'bet':
          // Verificar que puede apostar
          if (this.currentBet > 0) {
            throw new Error('Ya hay una apuesta, debes subir o igualar');
          }
          
          // Validar apuesta
          const betValidation = gameRules.isValidBet(
            amount,
            this.currentBet,
            player.balance,
            'bet'
          );
          
          if (!betValidation.valid) {
            throw new Error(betValidation.message);
          }
          
          player.placeBet(amount);
          this.currentBet = amount;
          player.lastAction = 'bet';
          break;
          
        case 'raise':
          // Verificar que puede subir
          if (this.currentBet <= 0) {
            throw new Error('No hay apuesta que subir');
          }
          
          // Validar subida
          const raiseValidation = gameRules.isValidBet(
            amount,
            this.currentBet,
            player.balance,
            'raise'
          );
          
          if (!raiseValidation.valid) {
            throw new Error(raiseValidation.message);
          }
          
          // Calcular cantidad adicional a la actual
          const additionalAmount = amount - player.currentBet;
          
          if (additionalAmount > player.balance) {
            throw new Error('No tienes suficiente balance');
          }
          
          player.placeBet(additionalAmount);
          this.currentBet = player.currentBet;
          player.lastAction = 'raise';
          actionRecord.amount = additionalAmount;
          break;
          
        case 'allIn':
          if (player.balance <= 0) {
            throw new Error('No tienes balance para ir all-in');
          }
          
          const allInAmount = player.balance;
          player.placeBet(allInAmount);
          
          if (player.currentBet > this.currentBet) {
            this.currentBet = player.currentBet;
          }
          
          player.lastAction = 'allIn';
          actionRecord.amount = allInAmount;
          break;
          
        default:
          throw new Error('Acción no válida');
      }
      
      // Añadir acción al historial
      this.history.push(actionRecord);
      
      // Actualizar timestamp
      this.lastActionTime = Date.now();
      
      // Avanzar al siguiente turno
      const nextPlayer = this.nextTurn();
      
      return {
        success: true,
        action: actionRecord,
        nextPlayer
      };
    }
  
    /**
     * Recolecta las apuestas de los jugadores al bote
     */
    collectBets() {
      let totalCollected = 0;
      
      // Sumar todas las apuestas actuales
      Object.values(this.room.players).forEach(player => {
        totalCollected += player.currentBet;
        player.currentBet = 0;
      });
      
      // Añadir al bote
      this.pot += totalCollected;
      this.currentBet = 0;
      
      return totalCollected;
    }
  
    /**
     * Verifica si todas las apuestas están igualadas
     * @returns {boolean} - True si están igualadas
     */
    allBetsEqualized() {
      return gameRules.allPlayersActedOrAllin(
        this.room.players,
        this.currentBet
      );
    }
  
    /**
     * Finaliza la mano actual y asigna el bote al ganador
     * @param {string} winnerId - ID del jugador ganador
     * @returns {Object} - Información del resultado
     */
    finishHand(winnerId) {
      const winner = this.room.players[winnerId];
      
      if (!winner) {
        throw new Error('Ganador no válido');
      }
      
      // Asignar el bote al ganador
      winner.winHand(this.pot);
      
      // Registro de resultado
      const result = {
        type: 'hand_result',
        winnerId,
        winnerName: winner.name,
        pot: this.pot,
        timestamp: Date.now()
      };
      
      // Añadir al historial
      this.history.push(result);
      
      // Preparar para la siguiente mano
      this.prepareNextHand();
      
      return result;
    }
  
    /**
     * Prepara el juego para la siguiente mano
     */
    prepareNextHand() {
      // Rotar posición del dealer
      this.dealerIndex = (this.dealerIndex + 1) % this.activePlayers.length;
      
      // Resetear estado
      this.pot = 0;
      this.currentBet = 0;
      this.currentPhase = GAME_PHASES.READY;
      this.currentTurn = null;
      
      // Resetear jugadores
      Object.values(this.room.players).forEach(player => {
        player.folded = false;
        player.currentBet = 0;
        player.isReady = false;
        player.lastAction = null;
      });
    }
  
    /**
     * Obtiene el jugador con un rol específico
     * @param {string} role - Rol a buscar
     * @returns {Object|null} - Jugador con ese rol o null
     */
    getPlayerByRole(role) {
      return Object.values(this.room.players).find(player => player.role === role) || null;
    }
  
    /**
     * Obtiene los jugadores activos (no retirados)
     * @returns {Array} - IDs de jugadores activos
     */
    getActivePlayers() {
      return Object.keys(this.room.players).filter(id => {
        const player = this.room.players[id];
        return !player.folded && player.connected;
      });
    }
  
    /**
     * Obtiene el estado actual del juego
     * @returns {Object} - Estado del juego
     */
    getState() {
      return {
        id: this.id,
        phase: this.currentPhase,
        pot: this.pot,
        currentBet: this.currentBet,
        currentTurn: this.currentTurn,
        round: this.round,
        activePlayers: this.getActivePlayers(),
        dealerIndex: this.dealerIndex,
        lastActionTime: this.lastActionTime
      };
    }
  }
  
  module.exports = Game;