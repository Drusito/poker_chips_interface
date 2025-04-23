<<<<<<< HEAD
/**
 * Componente de Jugador para la interfaz de usuario
 */

class Player {
    /**
     * Constructor
     * @param {Object} playerData - Datos del jugador
     * @param {boolean} isCurrentPlayer - Si es el jugador actual
     */
    constructor(playerData, isCurrentPlayer = false) {
      this.data = playerData;
      this.isCurrentPlayer = isCurrentPlayer;
      this.element = null;
      
      // Crear el elemento
      this.createElement();
      
      // Actualizar la UI
      this.update(playerData);
    }
    
    /**
     * Crea el elemento DOM del jugador
     */
    createElement() {
      // Clonar la plantilla
      const template = document.getElementById('playerTemplate');
      this.element = template.content.cloneNode(true).children[0];
      
      // Añadir clase para jugador actual si corresponde
      if (this.isCurrentPlayer) {
        this.element.classList.add('current-player');
      }
    }
    
    /**
     * Actualiza los datos del jugador
     * @param {Object} playerData - Nuevos datos del jugador
     */
    update(playerData) {
      this.data = playerData;
      
      // Actualizar nombre
      this.element.querySelector('.player-name').textContent = playerData.name;
      
      // Actualizar balance
      this.element.querySelector('.player-balance').textContent = `Balance: ${playerData.balance}€`;
      
      // Actualizar apuesta
      if (playerData.currentBet > 0) {
        this.element.querySelector('.player-bet').textContent = `Apuesta: ${playerData.currentBet}€`;
        this.element.querySelector('.player-bet').style.display = 'block';
      } else {
        this.element.querySelector('.player-bet').style.display = 'none';
      }
      
      // Actualizar badges
      this.updateBadges(playerData);
      
      // Marcar como retirado si corresponde
      if (playerData.folded) {
        this.element.classList.add('folded');
      } else {
        this.element.classList.remove('folded');
      }
    }
    
    /**
     * Actualiza las insignias del jugador
     * @param {Object} playerData - Datos del jugador
     */
    updateBadges(playerData) {
      // Resetear todas las insignias
      this.element.querySelector('.dealer-badge').classList.add('hidden');
      this.element.querySelector('.sb-badge').classList.add('hidden');
      this.element.querySelector('.bb-badge').classList.add('hidden');
      this.element.querySelector('.turn-badge').classList.add('hidden');
      this.element.querySelector('.ready-badge').classList.add('hidden');
      this.element.querySelector('.fold-badge').classList.add('hidden');
      
      // Mostrar insignias según el estado
      
      // Rol (dealer, SB, BB)
      if (playerData.role === 'dealer') {
        this.element.querySelector('.dealer-badge').classList.remove('hidden');
      } else if (playerData.role === 'smallBlind') {
        this.element.querySelector('.sb-badge').classList.remove('hidden');
      } else if (playerData.role === 'bigBlind') {
        this.element.querySelector('.bb-badge').classList.remove('hidden');
      }
      
      // Estado de listo
      if (playerData.isReady) {
        this.element.querySelector('.ready-badge').classList.remove('hidden');
      }
      
      // Retirado
      if (playerData.folded) {
        this.element.querySelector('.fold-badge').classList.remove('hidden');
      }
    }
    
    /**
     * Establece la posición del jugador en la mesa
     * @param {number} leftPercent - Posición horizontal en porcentaje
     * @param {number} topPercent - Posición vertical en porcentaje
     */
    setPosition(leftPercent, topPercent) {
      this.element.style.left = `${leftPercent}%`;
      this.element.style.top = `${topPercent}%`;
      this.element.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Marca al jugador como activo (con el turno actual)
     * @param {boolean} isActive - Si el jugador está activo
     */
    setActive(isActive) {
      if (isActive) {
        this.element.classList.add('active');
        this.element.querySelector('.turn-badge').classList.remove('hidden');
      } else {
        this.element.classList.remove('active');
        this.element.querySelector('.turn-badge').classList.add('hidden');
      }
    }
=======
/**
 * Componente de Jugador para la interfaz de usuario
 */

class Player {
    /**
     * Constructor
     * @param {Object} playerData - Datos del jugador
     * @param {boolean} isCurrentPlayer - Si es el jugador actual
     */
    constructor(playerData, isCurrentPlayer = false) {
      this.data = playerData;
      this.isCurrentPlayer = isCurrentPlayer;
      this.element = null;
      
      // Crear el elemento
      this.createElement();
      
      // Actualizar la UI
      this.update(playerData);
    }
    
    /**
     * Crea el elemento DOM del jugador
     */
    createElement() {
      // Clonar la plantilla
      const template = document.getElementById('playerTemplate');
      this.element = template.content.cloneNode(true).children[0];
      
      // Añadir clase para jugador actual si corresponde
      if (this.isCurrentPlayer) {
        this.element.classList.add('current-player');
      }
    }
    
    /**
     * Actualiza los datos del jugador
     * @param {Object} playerData - Nuevos datos del jugador
     */
    update(playerData) {
      this.data = playerData;
      
      // Actualizar nombre
      this.element.querySelector('.player-name').textContent = playerData.name;
      
      // Actualizar balance
      this.element.querySelector('.player-balance').textContent = `Balance: ${playerData.balance}€`;
      
      // Actualizar apuesta
      if (playerData.currentBet > 0) {
        this.element.querySelector('.player-bet').textContent = `Apuesta: ${playerData.currentBet}€`;
        this.element.querySelector('.player-bet').style.display = 'block';
      } else {
        this.element.querySelector('.player-bet').style.display = 'none';
      }
      
      // Actualizar badges
      this.updateBadges(playerData);
      
      // Marcar como retirado si corresponde
      if (playerData.folded) {
        this.element.classList.add('folded');
      } else {
        this.element.classList.remove('folded');
      }
    }
    
    /**
     * Actualiza las insignias del jugador
     * @param {Object} playerData - Datos del jugador
     */
    updateBadges(playerData) {
      // Resetear todas las insignias
      this.element.querySelector('.dealer-badge').classList.add('hidden');
      this.element.querySelector('.sb-badge').classList.add('hidden');
      this.element.querySelector('.bb-badge').classList.add('hidden');
      this.element.querySelector('.turn-badge').classList.add('hidden');
      this.element.querySelector('.ready-badge').classList.add('hidden');
      this.element.querySelector('.fold-badge').classList.add('hidden');
      
      // Mostrar insignias según el estado
      
      // Rol (dealer, SB, BB)
      if (playerData.role === 'dealer') {
        this.element.querySelector('.dealer-badge').classList.remove('hidden');
      } else if (playerData.role === 'smallBlind') {
        this.element.querySelector('.sb-badge').classList.remove('hidden');
      } else if (playerData.role === 'bigBlind') {
        this.element.querySelector('.bb-badge').classList.remove('hidden');
      }
      
      // Estado de listo
      if (playerData.isReady) {
        this.element.querySelector('.ready-badge').classList.remove('hidden');
      }
      
      // Retirado
      if (playerData.folded) {
        this.element.querySelector('.fold-badge').classList.remove('hidden');
      }
    }
    
    /**
     * Establece la posición del jugador en la mesa
     * @param {number} leftPercent - Posición horizontal en porcentaje
     * @param {number} topPercent - Posición vertical en porcentaje
     */
    setPosition(leftPercent, topPercent) {
      this.element.style.left = `${leftPercent}%`;
      this.element.style.top = `${topPercent}%`;
      this.element.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Marca al jugador como activo (con el turno actual)
     * @param {boolean} isActive - Si el jugador está activo
     */
    setActive(isActive) {
      if (isActive) {
        this.element.classList.add('active');
        this.element.querySelector('.turn-badge').classList.remove('hidden');
      } else {
        this.element.classList.remove('active');
        this.element.querySelector('.turn-badge').classList.add('hidden');
      }
    }
>>>>>>> 9b8b9b440cfea42ca610c79fcd0c5e8816fcd5f6
  }