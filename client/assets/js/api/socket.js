/**
 * Cliente de Socket.IO para comunicación con el servidor
 */

const SocketClient = {
    // Referencia al socket
    socket: null,
    
    // Callback para eventos
    eventCallback: null,
    
    /**
     * Inicializa el cliente de Socket.IO
     * @param {Function} eventCallback - Función para manejar eventos recibidos
     */
    init(eventCallback) {
      this.eventCallback = eventCallback;
      
      // Conectar al servidor
      this.socket = io();
      
      // Configurar eventos
      this.setupEvents();
    },
    
    /**
     * Configura los eventos del socket
     */
    setupEvents() {
      // Eventos de sala
      this.socket.on('roomJoined', (data) => {
        this.handleEvent('roomJoined', data);
      });
      
      this.socket.on('roomState', (data) => {
        this.handleEvent('roomState', data);
      });
      
      // Eventos de juego
      this.socket.on('gameState', (data) => {
        this.handleEvent('gameState', data);
      });
      
      this.socket.on('playerTurn', (data) => {
        this.handleEvent('playerTurn', data);
      });
      
      this.socket.on('handResult', (data) => {
        this.handleEvent('handResult', data);
      });
      
      // Eventos de mensajes
      this.socket.on('gameMessage', (data) => {
        this.handleEvent('gameMessage', data);
      });
      
      this.socket.on('gameError', (data) => {
        this.handleEvent('gameError', data);
      });
      
      // Eventos de conexión
      this.socket.on('connect', () => {
        console.log('Conectado al servidor');
      });
      
      this.socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        this.handleEvent('gameError', { message: 'Desconectado del servidor' });
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        this.handleEvent('gameError', { message: 'Error de conexión con el servidor' });
      });
    },
    
    /**
     * Maneja un evento recibido
     * @param {string} eventName - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    handleEvent(eventName, data) {
      console.log(`Evento recibido: ${eventName}`, data);
      
      if (this.eventCallback) {
        this.eventCallback(eventName, data);
      }
    },
    
    /**
     * Envía una solicitud para unirse a una sala
     * @param {string} name - Nombre del jugador
     * @param {string} roomId - ID de la sala
     */
    joinRoom(name, roomId) {
      this.socket.emit('joinRoom', { name, roomId });
    },
    
    /**
     * Envía una solicitud para salir de una sala
     * @param {string} roomId - ID de la sala
     */
    leaveRoom(roomId) {
      this.socket.emit('leaveRoom', { roomId });
    },
    
    /**
     * Envía una solicitud para marcar al jugador como listo
     * @param {string} roomId - ID de la sala
     */
    playerReady(roomId) {
      this.socket.emit('playerReady', { roomId });
    },
    
    /**
     * Envía una acción del jugador
     * @param {string} roomId - ID de la sala
     * @param {string} action - Tipo de acción (fold, check, call, bet, raise, allIn)
     * @param {number} amount - Cantidad para apostar o subir (opcional)
     */
    playerAction(roomId, action, amount = 0) {
      this.socket.emit('playerAction', { roomId, action, amount });
    },
    
    /**
     * Envía una solicitud para iniciar la siguiente mano
     * @param {string} roomId - ID de la sala
     * @param {string} winnerId - ID del jugador ganador
     */
    nextHand(roomId, winnerId) {
      this.socket.emit('nextHand', { roomId, winnerId });
    }
  };