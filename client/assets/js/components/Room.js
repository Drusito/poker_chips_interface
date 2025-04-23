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
  }