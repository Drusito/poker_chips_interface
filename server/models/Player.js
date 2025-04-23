/**
 * Clase que representa a un jugador en el juego
 */

class Player {
    /**
     * Constructor del jugador
     * @param {string} id - ID del socket del jugador
     * @param {string} name - Nombre del jugador
     * @param {number} balance - Balance inicial
     */
    constructor(id, name, balance) {
      this.id = id;              // ID del socket
      this.name = name;          // Nombre del jugador
      this.balance = balance;    // Balance actual
      this.currentBet = 0;       // Apuesta en la ronda actual
      this.folded = false;       // Si se ha retirado en la mano actual
      this.isReady = false;      // Si está listo para comenzar
      this.lastAction = null;    // Última acción realizada
      this.lastActionTime = null;// Timestamp de la última acción
      this.role = null;          // Rol en la mesa (dealer, SB, BB, etc)
      this.connected = true;     // Estado de conexión
      this.avatar = null;        // URL del avatar (opcional)
      this.stats = {             // Estadísticas del jugador
        handsPlayed: 0,
        handsWon: 0,
        totalBets: 0,
        biggestWin: 0
      };
    }
  
    /**
     * Realiza una apuesta
     * @param {number} amount - Cantidad a apostar
     * @returns {number} - Cantidad apostada
     */
    placeBet(amount) {
      // Asegurar que no se apuesta más de lo que se tiene
      const actualAmount = Math.min(amount, this.balance);
      
      // Restar del balance
      this.balance -= actualAmount;
      
      // Añadir a la apuesta actual
      this.currentBet += actualAmount;
      
      // Actualizar estadísticas
      this.stats.totalBets += actualAmount;
      
      // Actualizar timestamp
      this.lastActionTime = Date.now();
      
      return actualAmount;
    }
  
    /**
     * Añade fondos al balance del jugador
     * @param {number} amount - Cantidad a añadir
     * @returns {number} - Nuevo balance
     */
    addFunds(amount) {
      if (amount <= 0) return this.balance;
      
      this.balance += amount;
      return this.balance;
    }
  
    /**
     * Marca al jugador como ganador de una mano
     * @param {number} potAmount - Cantidad del bote ganado
     */
    winHand(potAmount) {
      this.stats.handsWon++;
      this.stats.biggestWin = Math.max(this.stats.biggestWin, potAmount);
      this.balance += potAmount;
      this.stats.handsPlayed++;
    }
  
    /**
     * Actualiza el estado de conexión del jugador
     * @param {boolean} status - Nuevo estado de conexión
     */
    setConnected(status) {
      this.connected = status;
    }
  
    /**
     * Marca al jugador como que ha jugado una mano
     */
    playHand() {
      this.stats.handsPlayed++;
    }
  
    /**
     * Reinicia el estado del jugador para una nueva mano
     */
    resetForNewHand() {
      this.folded = false;
      this.currentBet = 0;
      this.lastAction = null;
      this.role = null;
    }
  
    /**
     * Marca al jugador como listo/no listo
     * @param {boolean} status - Nuevo estado de listo
     */
    setReady(status = true) {
      this.isReady = status;
    }
  
    /**
     * Verifica si el jugador puede actuar (no está retirado ni all-in)
     * @returns {boolean} - True si puede actuar
     */
    canAct() {
      return !this.folded && this.balance > 0 && this.connected;
    }
  
    /**
     * Verifica si el jugador puede apostar cierta cantidad
     * @param {number} amount - Cantidad a verificar
     * @returns {boolean} - True si puede apostar esa cantidad
     */
    canAfford(amount) {
      return this.balance >= amount;
    }
  
    /**
     * Obtiene el tiempo desde la última acción
     * @returns {number} - Tiempo en milisegundos desde la última acción
     */
    getTimeSinceLastAction() {
      if (!this.lastActionTime) return null;
      return Date.now() - this.lastActionTime;
    }
    
    /**
     * Convierte el objeto jugador a un formato seguro para enviar al cliente
     * @returns {Object} - Datos del jugador para el cliente
     */
    toClientData() {
      return {
        id: this.id,
        name: this.name,
        balance: this.balance,
        currentBet: this.currentBet,
        folded: this.folded,
        isReady: this.isReady,
        lastAction: this.lastAction,
        role: this.role,
        connected: this.connected,
        avatar: this.avatar,
        stats: this.stats
      };
    }
    
    /**
     * Actualiza datos del jugador desde un objeto
     * @param {Object} data - Datos a actualizar
     */
    updateFromData(data) {
      // Solo actualizar propiedades permitidas
      const allowedProps = ['name', 'avatar', 'isReady'];
      
      for (const prop of allowedProps) {
        if (data.hasOwnProperty(prop)) {
          this[prop] = data[prop];
        }
      }
    }
  }
  
  module.exports = Player;