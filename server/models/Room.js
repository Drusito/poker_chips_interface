<<<<<<< HEAD
/**
 * Clase que representa una sala de juego
 */

const { 
    GAME_CONFIG, 
    GAME_PHASES, 
    POKER_RULES 
  } = require('../config/constants');
  const Player = require('./Player');
  
  class Room {
    /**
     * Constructor de la sala
     * @param {string} id - Identificador único de la sala
     */
    constructor(id) {
      this.id = id;
      this.players = {};           // Objetos Player indexados por ID de socket
      this.turnOrder = [];         // Orden de turnos (IDs de socket)
      this.currentPhase = GAME_PHASES.WAITING;
      this.currentTurn = null;     // ID del jugador con el turno actual
      this.pot = 0;                // Bote acumulado
      this.currentBet = 0;         // Apuesta actual a igualar
      this.dealerIndex = 0;        // Índice del dealer en el array turnOrder
      this.lastActionTime = Date.now();
      this.spectators = [];        // Espectadores (no jugadores)
      this.handHistory = [];       // Historial de manos jugadas
      this.roundHistory = [];      // Historial de acciones en la ronda actual
    }
  
    /**
     * Añade un jugador a la sala
     * @param {string} playerId - ID del socket del jugador
     * @param {string} name - Nombre del jugador
     * @param {number} balance - Balance inicial (opcional)
     * @returns {Player} - El jugador añadido
     */
    addPlayer(playerId, name, balance = GAME_CONFIG.DEFAULT_BALANCE) {
      // Verificar si la sala está llena
      if (Object.keys(this.players).length >= GAME_CONFIG.MAX_PLAYERS) {
        throw new Error('La sala está llena');
      }
  
      // Crear y añadir el jugador
      const player = new Player(playerId, name, balance);
      this.players[playerId] = player;
      this.turnOrder.push(playerId);
      
      return player;
    }
  
    /**
     * Elimina un jugador de la sala
     * @param {string} playerId - ID del socket del jugador
     * @returns {boolean} - True si se eliminó correctamente
     */
    removePlayer(playerId) {
      if (!this.players[playerId]) {
        return false;
      }
  
      // Eliminar el jugador
      delete this.players[playerId];
      this.turnOrder = this.turnOrder.filter(id => id !== playerId);
  
      // Si era el turno del jugador eliminado, avanzar al siguiente
      if (this.currentTurn === playerId) {
        this.nextTurn();
      }
  
      // Si no quedan suficientes jugadores, resetear la partida
      if (Object.keys(this.players).length < GAME_CONFIG.MIN_PLAYERS) {
        this.resetGame();
      }
  
      return true;
    }
  
    /**
     * Marca un jugador como listo para jugar
     * @param {string} playerId - ID del socket del jugador
     * @returns {boolean} - True si todos los jugadores están listos
     */
    setPlayerReady(playerId) {
      const player = this.players[playerId];
      if (!player) {
        return false;
      }
  
      player.isReady = true;
      
      // Comprobar si todos los jugadores están listos
      const allReady = Object.keys(this.players).every(id => this.players[id].isReady);
      
      // Verificar que hay suficientes jugadores
      const enoughPlayers = Object.keys(this.players).length >= 2;
      
      if (allReady && enoughPlayers) {
        this.currentPhase = GAME_PHASES.READY;
        console.log("Todos los jugadores están listos y hay suficientes jugadores.");
        return true;
      }
      
      return false;
    }
  
    /**
     * Inicia una nueva mano
     */
    startNewHand() {
      console.log("Iniciando nueva mano...");
      
      // Verificar si hay suficientes jugadores
      if (Object.keys(this.players).length < 2) {
        console.error("No hay suficientes jugadores para iniciar la mano");
        return false;
      }
      
      // Verificar que todos estén listos
      const allReady = Object.keys(this.players).every(id => this.players[id].isReady);
      if (!allReady) {
        console.error("No todos los jugadores están listos");
        return false;
      }
      
      // Resetear estado de la mano
      this.pot = 0;
      this.currentBet = 0;
      this.roundHistory = [];
      
      // Resetear estado de los jugadores
      this.turnOrder = Object.keys(this.players);
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.lastAction = null;
        player.role = null;
      });
  
      // Actualizar fase de juego
      this.currentPhase = GAME_PHASES.PRE_FLOP;
      
      console.log(`Fase del juego establecida a: ${this.currentPhase}`);
      console.log(`Turnos: ${this.turnOrder.join(', ')}`);
  
      // Actualizar roles (dealer, SB, BB)
      this.assignRoles();
      
      // Establecer ciegas
      this.collectBlinds();
      
      // Establecer el primer turno
      this.setFirstTurn();
      
      // Registrar inicio de mano en historial
      this.handHistory.push({
        timestamp: Date.now(),
        players: Object.values(this.players).map(p => ({
          id: p.id,
          name: p.name,
          balance: p.balance
        })),
        dealerPosition: this.dealerIndex
      });
      
      console.log(`Mano iniciada. Turno actual: ${this.currentTurn}`);
      return true;
    }
  
    /**
     * Asigna los roles de dealer, SB y BB
     */
    assignRoles() {
      console.log("Asignando roles a jugadores...");
      const playerCount = this.turnOrder.length;
      
      if (playerCount < 2) {
        console.error("No hay suficientes jugadores para asignar roles");
        return false;
      }
      
      // Primero resetear roles de todos
      for (const id in this.players) {
        this.players[id].role = null;
      }
      
      // Calcular índices para roles basados en posición del dealer
      const dealerIdx = this.dealerIndex % playerCount;
      
      // En juegos con 2 jugadores, el dealer es SB y el otro es BB
      if (playerCount === 2) {
        const dealerId = this.turnOrder[dealerIdx];
        const otherIdx = (dealerIdx + 1) % playerCount;
        const otherId = this.turnOrder[otherIdx];
        
        // En juegos heads-up, el dealer es la ciega pequeña
        this.players[dealerId].role = 'smallBlind';
        this.players[otherId].role = 'bigBlind';
        
        console.log(`Juego heads-up: ${this.players[dealerId].name} es SB (dealer), ${this.players[otherId].name} es BB`);
        
        return {
          dealerId,
          smallBlindId: dealerId,
          bigBlindId: otherId
        };
      }
      
      // Para 3+ jugadores, posiciones normales
      const dealerId = this.turnOrder[dealerIdx];
      const sbIdx = (dealerIdx + 1) % playerCount;
      const bbIdx = (dealerIdx + 2) % playerCount;
      
      const sbId = this.turnOrder[sbIdx];
      const bbId = this.turnOrder[bbIdx];
      
      // Asignar roles
      this.players[dealerId].role = 'dealer';
      this.players[sbId].role = 'smallBlind';
      this.players[bbId].role = 'bigBlind';
      
      console.log(`Dealer: ${this.players[dealerId].name}, SB: ${this.players[sbId].name}, BB: ${this.players[bbId].name}`);
      
      return {
        dealerId,
        smallBlindId: sbId,
        bigBlindId: bbId
      };
    }
  
    /**
     * Cobra las ciegas a los jugadores correspondientes
     */
    collectBlinds() {
      console.log("Cobrando ciegas...");
      let sbPlayer = null;
      let bbPlayer = null;
      
      // Identificar jugadores con roles de SB y BB
      for (const playerId of this.turnOrder) {
        const player = this.players[playerId];
        if (player.role === 'smallBlind') {
          sbPlayer = player;
        } else if (player.role === 'bigBlind') {
          bbPlayer = player;
        }
      }
      
      // Verificar que tenemos ambos jugadores
      if (!sbPlayer || !bbPlayer) {
        console.error("No se encontraron jugadores para las ciegas");
        console.log("Roles asignados:", Object.values(this.players).map(p => `${p.name}: ${p.role}`));
        return false;
      }
      
      console.log(`Ciega pequeña: ${sbPlayer.name}, Ciega grande: ${bbPlayer.name}`);
      
      // Cobrar ciega pequeña
      const sbAmount = Math.min(POKER_RULES.SMALL_BLIND, sbPlayer.balance);
      sbPlayer.placeBet(sbAmount);
      sbPlayer.lastAction = 'blind';
      console.log(`${sbPlayer.name} coloca ciega pequeña: ${sbAmount}`);
      
      // Cobrar ciega grande
      const bbAmount = Math.min(POKER_RULES.BIG_BLIND, bbPlayer.balance);
      bbPlayer.placeBet(bbAmount);
      bbPlayer.lastAction = 'blind';
      console.log(`${bbPlayer.name} coloca ciega grande: ${bbAmount}`);
      
      // Establecer apuesta actual igual a la ciega grande
      this.currentBet = bbAmount;
      console.log(`Apuesta actual establecida en: ${this.currentBet}`);
      
      return true;
    }
  
    /**
     * Establece el primer turno de la ronda
     */
    setFirstTurn() {
      console.log("Estableciendo primer turno...");
      
      // En PreFlop, el primer turno es del jugador después de la ciega grande
      let bbIndex = -1;
      
      // Buscar la posición de la ciega grande
      for (let i = 0; i < this.turnOrder.length; i++) {
        if (this.players[this.turnOrder[i]].role === 'bigBlind') {
          bbIndex = i;
          break;
        }
      }
      
      if (bbIndex === -1) {
        console.error("No se encontró la ciega grande para establecer el primer turno");
        // Fallback: usar el primer jugador
        this.currentTurn = this.turnOrder[0];
        console.log(`Primer turno (fallback) asignado a: ${this.currentTurn}`);
        return this.currentTurn;
      }
      
      // El primer jugador es el que está después de la ciega grande
      const firstPlayerIndex = (bbIndex + 1) % this.turnOrder.length;
      this.currentTurn = this.turnOrder[firstPlayerIndex];
      
      console.log(`Primer turno asignado a: ${this.currentTurn} (jugador después de BB)`);
      
      // Si estamos en otra fase que no sea PreFlop, empieza el jugador después del dealer
      if (this.currentPhase !== 'preFlop') {
        const dealerIndex = this.turnOrder.findIndex(id => this.players[id].role === 'dealer');
        if (dealerIndex !== -1) {
          const firstActiveIndex = this.getNextActivePlayerIndex(dealerIndex);
          if (firstActiveIndex !== -1) {
            this.currentTurn = this.turnOrder[firstActiveIndex];
            console.log(`Primer turno en ${this.currentPhase} asignado a: ${this.currentTurn}`);
          }
        }
      }
      
      this.lastActionTime = Date.now();
      return this.currentTurn;
    }
  
    /**
     * Avanza al siguiente turno
     */
    nextTurn() {
      const currentIndex = this.turnOrder.indexOf(this.currentTurn);
      if (currentIndex === -1) return;
      
      // Buscar al siguiente jugador activo
      const nextIndex = this.getNextActivePlayerIndex(currentIndex);
      
      // Si no hay siguiente jugador o todos han igualado la apuesta, pasar a la siguiente fase
      if (nextIndex === -1 || this.allPlayersBetsEqualized()) {
        this.nextPhase();
      } else {
        this.currentTurn = this.turnOrder[nextIndex];
        this.lastActionTime = Date.now();
      }
    }
  
    /**
     * Obtiene el índice del siguiente jugador activo
     * @param {number} currentIndex - Índice del jugador actual
     * @returns {number} - Índice del siguiente jugador o -1 si no hay ninguno
     */
    getNextActivePlayerIndex(currentIndex) {
      const count = this.turnOrder.length;
      
      for (let i = 1; i <= count; i++) {
        const nextIndex = (currentIndex + i) % count;
        const nextId = this.turnOrder[nextIndex];
        const nextPlayer = this.players[nextId];
        
        // Verificar que el jugador está activo (no se ha retirado)
        if (!nextPlayer.folded && nextPlayer.balance > 0) {
          return nextIndex;
        }
      }
      
      return -1; // No hay más jugadores activos
    }
  
    /**
     * Comprueba si todos los jugadores han igualado la apuesta actual
     * @returns {boolean} - True si todos han igualado
     */
    allPlayersBetsEqualized() {
      return this.turnOrder.every(id => {
        const player = this.players[id];
        // Un jugador ha igualado si: se ha retirado, está all-in, o ha igualado la apuesta
        return player.folded || 
               player.balance === 0 || 
               player.currentBet === this.currentBet;
      });
    }
  
    /**
     * Avanza a la siguiente fase del juego
     */
    nextPhase() {
      // Recolectar apuestas al bote
      this.collectBets();
      
      // Determinar la siguiente fase
      switch (this.currentPhase) {
        case GAME_PHASES.PRE_FLOP:
          this.currentPhase = GAME_PHASES.FLOP;
          break;
        case GAME_PHASES.FLOP:
          this.currentPhase = GAME_PHASES.TURN;
          break;
        case GAME_PHASES.TURN:
          this.currentPhase = GAME_PHASES.RIVER;
          break;
        case GAME_PHASES.RIVER:
          this.currentPhase = GAME_PHASES.SHOWDOWN;
          return; // En showdown no hay más turnos
        default:
          return;
      }
      
      console.log(`Avanzando a fase: ${this.currentPhase}`);
      
      // Resetear la apuesta actual para la nueva fase
      this.currentBet = 0;
      this.turnOrder.forEach(id => {
        this.players[id].currentBet = 0;
      });
      
      // Establecer el primer turno de la nueva fase
      this.setFirstTurn();
    }
  
    /**
     * Recolecta las apuestas de todos los jugadores al bote
     */
    collectBets() {
      let totalCollected = 0;
      
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        totalCollected += player.currentBet;
        player.currentBet = 0;
      });
      
      this.pot += totalCollected;
      this.currentBet = 0;
      
      return totalCollected;
    }
  
    /**
     * Finaliza la mano actual y distribuye el bote
     * @param {string} winnerId - ID del jugador ganador
     * @returns {Object} - Información del resultado
     */
    finishHand(winnerId) {
      const winner = this.players[winnerId];
      if (!winner) {
        throw new Error('Jugador ganador no encontrado');
      }
      
      // Asignar el bote al ganador
      winner.balance += this.pot;
      
      // Guardar el resultado en el historial
      const result = {
        timestamp: Date.now(),
        winner: {
          id: winner.id,
          name: winner.name
        },
        pot: this.pot
      };
      
      // Actualizar el historial de la mano actual
      if (this.handHistory.length > 0) {
        this.handHistory[this.handHistory.length - 1].result = result;
      }
      
      // Prepararse para la siguiente mano
      this.prepareNextHand();
      
      return result;
    }
  
    /**
     * Prepara la sala para la siguiente mano
     */
    prepareNextHand() {
      // Rotar el dealer
      this.dealerIndex = (this.dealerIndex + 1) % this.turnOrder.length;
      
      // Resetear el estado del juego
      this.pot = 0;
      this.currentBet = 0;
      this.currentPhase = GAME_PHASES.READY;
      
      // Resetear jugadores
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.isReady = false;
        player.lastAction = null;
      });
    }
  
/**
 * Procesa una acción de un jugador
 * @param {string} playerId - ID del jugador
 * @param {string} actionType - Tipo de acción (fold, check, call, etc)
 * @param {number} amount - Cantidad para apostar o subir (opcional)
 * @returns {Object} - Resultado de la acción
 */
processPlayerAction(playerId, actionType, amount = 0) {
    console.log(`Procesando acción: ${actionType} para jugador ${playerId} con cantidad ${amount}`);
    
    // Verificar que es el turno del jugador
    if (playerId !== this.currentTurn) {
      throw new Error('No es el turno de este jugador');
    }
    
    const player = this.players[playerId];
    
    // Registrar la acción en el historial
    const actionRecord = {
      playerId,
      playerName: player.name,
      type: actionType,
      amount,
      timestamp: Date.now()
    };
    this.roundHistory.push(actionRecord);
    
    // Procesar la acción según su tipo
    switch (actionType) {
      case 'fold':
        player.folded = true;
        player.lastAction = 'fold';
        console.log(`${player.name} ha hecho fold`);
        break;
        
      case 'check':
        if (this.currentBet > player.currentBet) {
          throw new Error('No puedes pasar, debes igualar o retirarte');
        }
        player.lastAction = 'check';
        console.log(`${player.name} ha hecho check`);
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
        console.log(`${player.name} ha igualado ${callAmount}€`);
        break;
        
      case 'bet':
        // Verificar que puede apostar
        if (this.currentBet > 0) {
          throw new Error('Ya hay una apuesta, debes subir en su lugar');
        }
        
        if (amount < POKER_RULES.MIN_BET) {
          throw new Error(`La apuesta mínima es ${POKER_RULES.MIN_BET}`);
        }
        
        if (amount > player.balance) {
          throw new Error('No tienes suficiente balance');
        }
        
        player.placeBet(amount);
        this.currentBet = amount;
        player.lastAction = 'bet';
        console.log(`${player.name} ha apostado ${amount}€`);
        break;
        
      case 'raise':
        // Verificar que puede subir
        if (this.currentBet <= 0) {
          throw new Error('No hay apuesta que subir, debes apostar');
        }
        
        // En el cliente, amount será el total a apostar
        // Necesitamos adaptar esto para tener en cuenta la apuesta actual del jugador
        const totalRaise = amount;
        const additionalAmount = totalRaise - player.currentBet;
        
        console.log(`Subida total: ${totalRaise}, Adicional: ${additionalAmount}, Balance: ${player.balance}`);
        
        if (additionalAmount > player.balance) {
          throw new Error('No tienes suficiente balance');
        }
        
        // Verificar que la subida cumple el mínimo (normalmente el doble de la apuesta actual)
        if (totalRaise < this.currentBet * 2) {
          throw new Error(`La subida mínima es ${this.currentBet * 2}€`);
        }
        
        player.placeBet(additionalAmount);
        this.currentBet = player.currentBet;
        player.lastAction = 'raise';
        console.log(`${player.name} ha subido a ${player.currentBet}€ (añadiendo ${additionalAmount}€)`);
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
        console.log(`${player.name} ha ido all-in con ${allInAmount}€`);
        break;
        
      default:
        throw new Error('Acción no válida');
    }
    
    // Actualizar timestamp de última acción
    this.lastActionTime = Date.now();
    
    // Pasar al siguiente turno
    this.nextTurn();
    
    return actionRecord;
  }
  
    /**
     * Reinicia el juego a estado inicial
     */
    resetGame() {
      this.currentPhase = GAME_PHASES.WAITING;
      this.currentTurn = null;
      this.pot = 0;
      this.currentBet = 0;
      this.roundHistory = [];
      
      // Resetear jugadores
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.isReady = false;
        player.lastAction = null;
      });
    }
  
    /**
     * Obtiene el estado actual de la sala
     * @returns {Object} - Estado actual
     */
    getState() {
      return {
        id: this.id,
        players: this.players,
        turnOrder: this.turnOrder,
        currentPhase: this.currentPhase,
        currentTurn: this.currentTurn,
        pot: this.pot,
        currentBet: this.currentBet,
        dealerIndex: this.dealerIndex,
        allReady: this.turnOrder.every(id => this.players[id].isReady),
      };
    }
  }
  
=======
/**
 * Clase que representa una sala de juego
 */

const { 
    GAME_CONFIG, 
    GAME_PHASES, 
    POKER_RULES 
  } = require('../config/constants');
  const Player = require('./Player');
  
  class Room {
    /**
     * Constructor de la sala
     * @param {string} id - Identificador único de la sala
     */
    constructor(id) {
      this.id = id;
      this.players = {};           // Objetos Player indexados por ID de socket
      this.turnOrder = [];         // Orden de turnos (IDs de socket)
      this.currentPhase = GAME_PHASES.WAITING;
      this.currentTurn = null;     // ID del jugador con el turno actual
      this.pot = 0;                // Bote acumulado
      this.currentBet = 0;         // Apuesta actual a igualar
      this.dealerIndex = 0;        // Índice del dealer en el array turnOrder
      this.lastActionTime = Date.now();
      this.spectators = [];        // Espectadores (no jugadores)
      this.handHistory = [];       // Historial de manos jugadas
      this.roundHistory = [];      // Historial de acciones en la ronda actual
    }
  
    /**
     * Añade un jugador a la sala
     * @param {string} playerId - ID del socket del jugador
     * @param {string} name - Nombre del jugador
     * @param {number} balance - Balance inicial (opcional)
     * @returns {Player} - El jugador añadido
     */
    addPlayer(playerId, name, balance = GAME_CONFIG.DEFAULT_BALANCE) {
      // Verificar si la sala está llena
      if (Object.keys(this.players).length >= GAME_CONFIG.MAX_PLAYERS) {
        throw new Error('La sala está llena');
      }
  
      // Crear y añadir el jugador
      const player = new Player(playerId, name, balance);
      this.players[playerId] = player;
      this.turnOrder.push(playerId);
      
      return player;
    }
  
    /**
     * Elimina un jugador de la sala
     * @param {string} playerId - ID del socket del jugador
     * @returns {boolean} - True si se eliminó correctamente
     */
    removePlayer(playerId) {
      if (!this.players[playerId]) {
        return false;
      }
  
      // Eliminar el jugador
      delete this.players[playerId];
      this.turnOrder = this.turnOrder.filter(id => id !== playerId);
  
      // Si era el turno del jugador eliminado, avanzar al siguiente
      if (this.currentTurn === playerId) {
        this.nextTurn();
      }
  
      // Si no quedan suficientes jugadores, resetear la partida
      if (Object.keys(this.players).length < GAME_CONFIG.MIN_PLAYERS) {
        this.resetGame();
      }
  
      return true;
    }
  
    /**
     * Marca un jugador como listo para jugar
     * @param {string} playerId - ID del socket del jugador
     * @returns {boolean} - True si todos los jugadores están listos
     */
    setPlayerReady(playerId) {
      const player = this.players[playerId];
      if (!player) {
        return false;
      }
  
      player.isReady = true;
      
      // Comprobar si todos los jugadores están listos
      const allReady = Object.keys(this.players).every(id => this.players[id].isReady);
      
      // Verificar que hay suficientes jugadores
      const enoughPlayers = Object.keys(this.players).length >= 2;
      
      if (allReady && enoughPlayers) {
        this.currentPhase = GAME_PHASES.READY;
        console.log("Todos los jugadores están listos y hay suficientes jugadores.");
        return true;
      }
      
      return false;
    }
  
    /**
     * Inicia una nueva mano
     */
    startNewHand() {
      console.log("Iniciando nueva mano...");
      
      // Verificar si hay suficientes jugadores
      if (Object.keys(this.players).length < 2) {
        console.error("No hay suficientes jugadores para iniciar la mano");
        return false;
      }
      
      // Verificar que todos estén listos
      const allReady = Object.keys(this.players).every(id => this.players[id].isReady);
      if (!allReady) {
        console.error("No todos los jugadores están listos");
        return false;
      }
      
      // Resetear estado de la mano
      this.pot = 0;
      this.currentBet = 0;
      this.roundHistory = [];
      
      // Resetear estado de los jugadores
      this.turnOrder = Object.keys(this.players);
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.lastAction = null;
        player.role = null;
      });
  
      // Actualizar fase de juego
      this.currentPhase = GAME_PHASES.PRE_FLOP;
      
      console.log(`Fase del juego establecida a: ${this.currentPhase}`);
      console.log(`Turnos: ${this.turnOrder.join(', ')}`);
  
      // Actualizar roles (dealer, SB, BB)
      this.assignRoles();
      
      // Establecer ciegas
      this.collectBlinds();
      
      // Establecer el primer turno
      this.setFirstTurn();
      
      // Registrar inicio de mano en historial
      this.handHistory.push({
        timestamp: Date.now(),
        players: Object.values(this.players).map(p => ({
          id: p.id,
          name: p.name,
          balance: p.balance
        })),
        dealerPosition: this.dealerIndex
      });
      
      console.log(`Mano iniciada. Turno actual: ${this.currentTurn}`);
      return true;
    }
  
    /**
     * Asigna los roles de dealer, SB y BB
     */
    assignRoles() {
      console.log("Asignando roles a jugadores...");
      const playerCount = this.turnOrder.length;
      
      if (playerCount < 2) {
        console.error("No hay suficientes jugadores para asignar roles");
        return false;
      }
      
      // Primero resetear roles de todos
      for (const id in this.players) {
        this.players[id].role = null;
      }
      
      // Calcular índices para roles basados en posición del dealer
      const dealerIdx = this.dealerIndex % playerCount;
      
      // En juegos con 2 jugadores, el dealer es SB y el otro es BB
      if (playerCount === 2) {
        const dealerId = this.turnOrder[dealerIdx];
        const otherIdx = (dealerIdx + 1) % playerCount;
        const otherId = this.turnOrder[otherIdx];
        
        // En juegos heads-up, el dealer es la ciega pequeña
        this.players[dealerId].role = 'smallBlind';
        this.players[otherId].role = 'bigBlind';
        
        console.log(`Juego heads-up: ${this.players[dealerId].name} es SB (dealer), ${this.players[otherId].name} es BB`);
        
        return {
          dealerId,
          smallBlindId: dealerId,
          bigBlindId: otherId
        };
      }
      
      // Para 3+ jugadores, posiciones normales
      const dealerId = this.turnOrder[dealerIdx];
      const sbIdx = (dealerIdx + 1) % playerCount;
      const bbIdx = (dealerIdx + 2) % playerCount;
      
      const sbId = this.turnOrder[sbIdx];
      const bbId = this.turnOrder[bbIdx];
      
      // Asignar roles
      this.players[dealerId].role = 'dealer';
      this.players[sbId].role = 'smallBlind';
      this.players[bbId].role = 'bigBlind';
      
      console.log(`Dealer: ${this.players[dealerId].name}, SB: ${this.players[sbId].name}, BB: ${this.players[bbId].name}`);
      
      return {
        dealerId,
        smallBlindId: sbId,
        bigBlindId: bbId
      };
    }
  
    /**
     * Cobra las ciegas a los jugadores correspondientes
     */
    collectBlinds() {
      console.log("Cobrando ciegas...");
      let sbPlayer = null;
      let bbPlayer = null;
      
      // Identificar jugadores con roles de SB y BB
      for (const playerId of this.turnOrder) {
        const player = this.players[playerId];
        if (player.role === 'smallBlind') {
          sbPlayer = player;
        } else if (player.role === 'bigBlind') {
          bbPlayer = player;
        }
      }
      
      // Verificar que tenemos ambos jugadores
      if (!sbPlayer || !bbPlayer) {
        console.error("No se encontraron jugadores para las ciegas");
        console.log("Roles asignados:", Object.values(this.players).map(p => `${p.name}: ${p.role}`));
        return false;
      }
      
      console.log(`Ciega pequeña: ${sbPlayer.name}, Ciega grande: ${bbPlayer.name}`);
      
      // Cobrar ciega pequeña
      const sbAmount = Math.min(POKER_RULES.SMALL_BLIND, sbPlayer.balance);
      sbPlayer.placeBet(sbAmount);
      sbPlayer.lastAction = 'blind';
      console.log(`${sbPlayer.name} coloca ciega pequeña: ${sbAmount}`);
      
      // Cobrar ciega grande
      const bbAmount = Math.min(POKER_RULES.BIG_BLIND, bbPlayer.balance);
      bbPlayer.placeBet(bbAmount);
      bbPlayer.lastAction = 'blind';
      console.log(`${bbPlayer.name} coloca ciega grande: ${bbAmount}`);
      
      // Establecer apuesta actual igual a la ciega grande
      this.currentBet = bbAmount;
      console.log(`Apuesta actual establecida en: ${this.currentBet}`);
      
      return true;
    }
  
    /**
     * Establece el primer turno de la ronda
     */
    setFirstTurn() {
      console.log("Estableciendo primer turno...");
      
      // En PreFlop, el primer turno es del jugador después de la ciega grande
      let bbIndex = -1;
      
      // Buscar la posición de la ciega grande
      for (let i = 0; i < this.turnOrder.length; i++) {
        if (this.players[this.turnOrder[i]].role === 'bigBlind') {
          bbIndex = i;
          break;
        }
      }
      
      if (bbIndex === -1) {
        console.error("No se encontró la ciega grande para establecer el primer turno");
        // Fallback: usar el primer jugador
        this.currentTurn = this.turnOrder[0];
        console.log(`Primer turno (fallback) asignado a: ${this.currentTurn}`);
        return this.currentTurn;
      }
      
      // El primer jugador es el que está después de la ciega grande
      const firstPlayerIndex = (bbIndex + 1) % this.turnOrder.length;
      this.currentTurn = this.turnOrder[firstPlayerIndex];
      
      console.log(`Primer turno asignado a: ${this.currentTurn} (jugador después de BB)`);
      
      // Si estamos en otra fase que no sea PreFlop, empieza el jugador después del dealer
      if (this.currentPhase !== 'preFlop') {
        const dealerIndex = this.turnOrder.findIndex(id => this.players[id].role === 'dealer');
        if (dealerIndex !== -1) {
          const firstActiveIndex = this.getNextActivePlayerIndex(dealerIndex);
          if (firstActiveIndex !== -1) {
            this.currentTurn = this.turnOrder[firstActiveIndex];
            console.log(`Primer turno en ${this.currentPhase} asignado a: ${this.currentTurn}`);
          }
        }
      }
      
      this.lastActionTime = Date.now();
      return this.currentTurn;
    }
  
    /**
     * Avanza al siguiente turno
     */
    nextTurn() {
      const currentIndex = this.turnOrder.indexOf(this.currentTurn);
      if (currentIndex === -1) return;
      
      // Buscar al siguiente jugador activo
      const nextIndex = this.getNextActivePlayerIndex(currentIndex);
      
      // Si no hay siguiente jugador o todos han igualado la apuesta, pasar a la siguiente fase
      if (nextIndex === -1 || this.allPlayersBetsEqualized()) {
        this.nextPhase();
      } else {
        this.currentTurn = this.turnOrder[nextIndex];
        this.lastActionTime = Date.now();
      }
    }
  
    /**
     * Obtiene el índice del siguiente jugador activo
     * @param {number} currentIndex - Índice del jugador actual
     * @returns {number} - Índice del siguiente jugador o -1 si no hay ninguno
     */
    getNextActivePlayerIndex(currentIndex) {
      const count = this.turnOrder.length;
      
      for (let i = 1; i <= count; i++) {
        const nextIndex = (currentIndex + i) % count;
        const nextId = this.turnOrder[nextIndex];
        const nextPlayer = this.players[nextId];
        
        // Verificar que el jugador está activo (no se ha retirado)
        if (!nextPlayer.folded && nextPlayer.balance > 0) {
          return nextIndex;
        }
      }
      
      return -1; // No hay más jugadores activos
    }
  
    /**
     * Comprueba si todos los jugadores han igualado la apuesta actual
     * @returns {boolean} - True si todos han igualado
     */
    allPlayersBetsEqualized() {
      return this.turnOrder.every(id => {
        const player = this.players[id];
        // Un jugador ha igualado si: se ha retirado, está all-in, o ha igualado la apuesta
        return player.folded || 
               player.balance === 0 || 
               player.currentBet === this.currentBet;
      });
    }
  
    /**
     * Avanza a la siguiente fase del juego
     */
    nextPhase() {
      // Recolectar apuestas al bote
      this.collectBets();
      
      // Determinar la siguiente fase
      switch (this.currentPhase) {
        case GAME_PHASES.PRE_FLOP:
          this.currentPhase = GAME_PHASES.FLOP;
          break;
        case GAME_PHASES.FLOP:
          this.currentPhase = GAME_PHASES.TURN;
          break;
        case GAME_PHASES.TURN:
          this.currentPhase = GAME_PHASES.RIVER;
          break;
        case GAME_PHASES.RIVER:
          this.currentPhase = GAME_PHASES.SHOWDOWN;
          return; // En showdown no hay más turnos
        default:
          return;
      }
      
      console.log(`Avanzando a fase: ${this.currentPhase}`);
      
      // Resetear la apuesta actual para la nueva fase
      this.currentBet = 0;
      this.turnOrder.forEach(id => {
        this.players[id].currentBet = 0;
      });
      
      // Establecer el primer turno de la nueva fase
      this.setFirstTurn();
    }
  
    /**
     * Recolecta las apuestas de todos los jugadores al bote
     */
    collectBets() {
      let totalCollected = 0;
      
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        totalCollected += player.currentBet;
        player.currentBet = 0;
      });
      
      this.pot += totalCollected;
      this.currentBet = 0;
      
      return totalCollected;
    }
  
    /**
     * Finaliza la mano actual y distribuye el bote
     * @param {string} winnerId - ID del jugador ganador
     * @returns {Object} - Información del resultado
     */
    finishHand(winnerId) {
      const winner = this.players[winnerId];
      if (!winner) {
        throw new Error('Jugador ganador no encontrado');
      }
      
      // Asignar el bote al ganador
      winner.balance += this.pot;
      
      // Guardar el resultado en el historial
      const result = {
        timestamp: Date.now(),
        winner: {
          id: winner.id,
          name: winner.name
        },
        pot: this.pot
      };
      
      // Actualizar el historial de la mano actual
      if (this.handHistory.length > 0) {
        this.handHistory[this.handHistory.length - 1].result = result;
      }
      
      // Prepararse para la siguiente mano
      this.prepareNextHand();
      
      return result;
    }
  
    /**
     * Prepara la sala para la siguiente mano
     */
    prepareNextHand() {
      // Rotar el dealer
      this.dealerIndex = (this.dealerIndex + 1) % this.turnOrder.length;
      
      // Resetear el estado del juego
      this.pot = 0;
      this.currentBet = 0;
      this.currentPhase = GAME_PHASES.READY;
      
      // Resetear jugadores
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.isReady = false;
        player.lastAction = null;
      });
    }
  
    /**
     * Procesa una acción de un jugador
     * @param {string} playerId - ID del jugador
     * @param {string} actionType - Tipo de acción (fold, check, call, etc)
     * @param {number} amount - Cantidad para apostar o subir (opcional)
     * @returns {Object} - Resultado de la acción
     */
    processPlayerAction(playerId, actionType, amount = 0) {
      // Verificar que es el turno del jugador
      if (playerId !== this.currentTurn) {
        throw new Error('No es el turno de este jugador');
      }
      
      const player = this.players[playerId];
      
      // Registrar la acción en el historial
      const actionRecord = {
        playerId,
        playerName: player.name,
        type: actionType,
        amount,
        timestamp: Date.now()
      };
      this.roundHistory.push(actionRecord);
      
      // Procesar la acción según su tipo
      switch (actionType) {
        case 'fold':
          player.folded = true;
          player.lastAction = 'fold';
          break;
          
        case 'check':
          if (this.currentBet > player.currentBet) {
            throw new Error('No puedes pasar, debes igualar o retirarte');
          }
          player.lastAction = 'check';
          break;
          
        case 'call':
          const callAmount = Math.min(
            this.currentBet - player.currentBet,
            player.balance
          );
          
          if (callAmount <= 0) {
            throw new Error('No hay apuesta que igualar');
          }
          
          player.placeBet(callAmount);
          player.lastAction = 'call';
          break;
          
        case 'bet':
          if (this.currentBet > 0) {
            throw new Error('Ya hay una apuesta, debes subir en su lugar');
          }
          
          if (amount < POKER_RULES.MIN_BET) {
            throw new Error(`La apuesta mínima es ${POKER_RULES.MIN_BET}`);
          }
          
          if (amount > player.balance) {
            throw new Error('No tienes suficiente balance');
          }
          
          player.placeBet(amount);
          this.currentBet = amount;
          player.lastAction = 'bet';
          break;
          
        case 'raise':
          if (this.currentBet <= 0) {
            throw new Error('No hay apuesta que subir, debes apostar');
          }
          
          const minRaise = this.currentBet * 2 - player.currentBet;
          if (amount < minRaise) {
            throw new Error(`La subida mínima es ${minRaise}`);
          }
          
          if (amount > player.balance) {
            throw new Error('No tienes suficiente balance');
          }
          
          player.placeBet(amount);
          this.currentBet = player.currentBet;
          player.lastAction = 'raise';
          break;
          
        case 'allIn':
          if (player.balance <= 0) {
            throw new Error('No tienes balance para ir all-in');
          }
          
          player.placeBet(player.balance);
          if (player.currentBet > this.currentBet) {
            this.currentBet = player.currentBet;
          }
          player.lastAction = 'allIn';
          break;
          
        default:
          throw new Error('Acción no válida');
      }
      
      // Actualizar timestamp de última acción
      this.lastActionTime = Date.now();
      
      // Pasar al siguiente turno
      this.nextTurn();
      
      return actionRecord;
    }
  
    /**
     * Reinicia el juego a estado inicial
     */
    resetGame() {
      this.currentPhase = GAME_PHASES.WAITING;
      this.currentTurn = null;
      this.pot = 0;
      this.currentBet = 0;
      this.roundHistory = [];
      
      // Resetear jugadores
      this.turnOrder.forEach(id => {
        const player = this.players[id];
        player.folded = false;
        player.currentBet = 0;
        player.isReady = false;
        player.lastAction = null;
      });
    }
  
    /**
     * Obtiene el estado actual de la sala
     * @returns {Object} - Estado actual
     */
    getState() {
      return {
        id: this.id,
        players: this.players,
        turnOrder: this.turnOrder,
        currentPhase: this.currentPhase,
        currentTurn: this.currentTurn,
        pot: this.pot,
        currentBet: this.currentBet,
        dealerIndex: this.dealerIndex,
        allReady: this.turnOrder.every(id => this.players[id].isReady),
      };
    }
  }
  
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
  module.exports = Room;