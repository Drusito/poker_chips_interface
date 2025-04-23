<<<<<<< HEAD
/**
 * Componente de Sala para la interfaz de usuario
 */

class Room {
    /**
     * Constructor
     */
    constructor() {
      this.roomId = null;
      this.currentPhase = 'waiting';
      this.phaseNames = {
        'waiting': 'ESPERANDO',
        'ready': 'LISTOS',
        'preFlop': 'PRE-FLOP',
        'flop': 'FLOP',
        'turn': 'TURN',
        'river': 'RIVER',
        'showdown': 'ENSEÑEN'
      };
      
      // Símbolos para las cartas (jokers genéricos)
      this.cardSymbols = ['🃏', '🃏', '🃏', '🃏', '🃏'];
    }
    
    /**
     * Establece la información de la sala
     * @param {string} roomId - ID de la sala
     */
    setRoom(roomId) {
      this.roomId = roomId;
      document.getElementById('currentRoom').textContent = roomId;
    }
    
    /**
     * Actualiza el estado de la sala
     * @param {Object} state - Estado de la sala
     */
    updateState(state) {
      // Actualizar fase del juego si ha cambiado
      if (this.currentPhase !== state.currentPhase) {
        this.updatePhase(state.currentPhase);
        this.currentPhase = state.currentPhase;
      }
      
      // Actualizar resto de elementos visuales
      let phaseText = this.phaseNames[state.currentPhase] || 'ESPERANDO';
      document.getElementById('gamePhase').textContent = phaseText;
      
      // Actualizar bote
      document.getElementById('potAmount').textContent = state.pot;
      
      // Mostrar/ocultar controles según fase
      this.updateControls(state);
    }
    
    /**
     * Actualiza la visualización de la fase del juego
     * @param {string} phase - Fase actual del juego
     */
    updatePhase(phase) {
      const phaseIndicator = document.getElementById('phaseIndicator');
      const displayName = this.phaseNames[phase] || 'ESPERANDO';
      
      // Actualizar texto con animación
      phaseIndicator.textContent = displayName;
      phaseIndicator.classList.add('phase-transition');
      
      // Actualizar cartas visibles según fase
      this.updateCommunityCards(phase);
      
      // Quitar clase de animación después
      setTimeout(() => {
        phaseIndicator.classList.remove('phase-transition');
      }, 1000);
    }
    
    /**
     * Actualiza las cartas comunitarias según la fase
     * @param {string} phase - Fase actual del juego
     */
    updateCommunityCards(phase) {
      const cards = document.querySelectorAll('.card');
      
      // Ocultar todas las cartas por defecto
      cards.forEach(card => {
        card.classList.add('hidden');
      });
      
      // Mostrar cartas según la fase
      switch (phase) {
        case 'flop':
          // Mostrar 3 cartas
          for (let i = 0; i < 3; i++) {
            cards[i].classList.remove('hidden');
          }
          break;
          
        case 'turn':
          // Mostrar 4 cartas
          for (let i = 0; i < 4; i++) {
            cards[i].classList.remove('hidden');
          }
          break;
          
        case 'river':
        case 'showdown':
          // Mostrar todas las cartas
          cards.forEach(card => {
            card.classList.remove('hidden');
          });
          break;
          
        default:
          // En preFlop o esperando, mantener todas ocultas
          break;
      }
    }
    
    /**
     * Actualiza los controles según la fase de juego
     * @param {Object} state - Estado de la sala
     */
    updateControls(state) {
      const readyBtn = document.getElementById('readyBtn');
      const handControl = document.getElementById('handControl');
      
      // Mostrar/ocultar botón de listo
      if (state.allReady || state.currentPhase !== 'waiting' && state.currentPhase !== 'ready') {
        readyBtn.style.display = 'none';
      } else {
        readyBtn.style.display = 'block';
      }
      
      // Mostrar/ocultar control de mano
      if (state.currentPhase === 'showdown') {
        handControl.style.display = 'block';
      } else {
        handControl.style.display = 'none';
      }
    }
    
    /**
     * Actualiza el selector de ganadores
     * @param {Object} players - Jugadores activos
     */
    updateWinnerSelect(players) {
      const winnerSelect = document.getElementById('winnerSelect');
      winnerSelect.innerHTML = '';
      
      // Añadir opciones para cada jugador activo
      for (const playerId in players) {
        const player = players[playerId];
        
        // Solo incluir jugadores que no se han retirado
        if (!player.folded) {
          const option = document.createElement('option');
          option.value = playerId;
          option.textContent = player.name;
          winnerSelect.appendChild(option);
        }
      }
    }
=======
/**
 * Componente de Sala para la interfaz de usuario
 */

class Room {
    /**
     * Constructor
     */
    constructor() {
      this.roomId = null;
    }
    
    /**
     * Establece la información de la sala
     * @param {string} roomId - ID de la sala
     */
    setRoom(roomId) {
      this.roomId = roomId;
      document.getElementById('currentRoom').textContent = roomId;
    }
    
    /**
     * Actualiza el estado de la sala
     * @param {Object} state - Estado de la sala
     */
    updateState(state) {
      // Actualizar fase
      let phaseText = 'Esperando jugadores';
      
      switch (state.currentPhase) {
        case 'waiting':
          phaseText = 'Esperando jugadores';
          break;
        case 'ready':
          phaseText = 'Jugadores listos';
          break;
        case 'preFlop':
          phaseText = 'Pre-Flop';
          break;
        case 'flop':
          phaseText = 'Flop';
          break;
        case 'turn':
          phaseText = 'Turn';
          break;
        case 'river':
          phaseText = 'River';
          break;
        case 'showdown':
          phaseText = 'Showdown';
          break;
      }
      
      document.getElementById('gamePhase').textContent = phaseText;
      
      // Actualizar bote
      document.getElementById('potAmount').textContent = state.pot;
      
      // Mostrar/ocultar controles según fase
      this.updateControls(state);
    }
    
    /**
     * Actualiza los controles según la fase de juego
     * @param {Object} state - Estado de la sala
     */
    updateControls(state) {
      const readyBtn = document.getElementById('readyBtn');
      const handControl = document.getElementById('handControl');
      
      // Mostrar/ocultar botón de listo
      if (state.allReady || state.currentPhase !== 'waiting' && state.currentPhase !== 'ready') {
        readyBtn.style.display = 'none';
      } else {
        readyBtn.style.display = 'block';
      }
      
      // Mostrar/ocultar control de mano
      if (state.currentPhase === 'showdown') {
        handControl.style.display = 'block';
      } else {
        handControl.style.display = 'none';
      }
    }
    
    /**
     * Actualiza el selector de ganadores
     * @param {Object} players - Jugadores activos
     */
    updateWinnerSelect(players) {
      const winnerSelect = document.getElementById('winnerSelect');
      winnerSelect.innerHTML = '';
      
      // Añadir opciones para cada jugador activo
      for (const playerId in players) {
        const player = players[playerId];
        
        // Solo incluir jugadores que no se han retirado
        if (!player.folded) {
          const option = document.createElement('option');
          option.value = playerId;
          option.textContent = player.name;
          winnerSelect.appendChild(option);
        }
      }
    }
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
  }