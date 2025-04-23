/**
 * Aplicación principal del cliente
 */

// Estado global de la aplicación
const App = {
    // Estado del juego
    state: {
      roomId: null,
      playerId: null,
      players: {},
      currentTurn: null,
      pot: 0,
      currentBet: 0,
      currentPhase: 'waiting',
      isReady: false
    },
    
    // Referencias a componentes
    components: {
      room: null,
      players: {},
      actions: null
    },
    
    // Inicialización de la aplicación
    init() {
      // Inicializar componentes
      this.components.room = new Room();
      this.components.actions = new Actions();
      
      // Inicializar eventos de UI
      this.initUIEvents();
      
      // Inicializar Socket.IO
      SocketClient.init(this.handleSocketEvents.bind(this));
    },
    
    // Inicializar eventos de UI
    initUIEvents() {
      // Botón de unirse a sala
      document.getElementById('joinRoomBtn').addEventListener('click', () => {
        const playerName = document.getElementById('playerName').value.trim();
        const roomId = document.getElementById('roomId').value.trim();
        
        if (!playerName || !roomId) {
          UIUtils.showMessage('Debes ingresar nombre y sala', 'error');
          return;
        }
        
        SocketClient.joinRoom(playerName, roomId);
      });
      
      // Botón de salir de sala
      document.getElementById('leaveRoomBtn').addEventListener('click', () => {
        if (this.state.roomId) {
          SocketClient.leaveRoom(this.state.roomId);
          this.switchToScreen('loginScreen');
          this.resetState();
        }
      });
      
      // Botón de listo
      document.getElementById('readyBtn').addEventListener('click', () => {
        if (this.state.roomId && !this.state.isReady) {
          SocketClient.playerReady(this.state.roomId);
          document.getElementById('readyBtn').disabled = true;
          UIUtils.updatePlayerStatus('Esperando a otros jugadores...');
        }
      });
      
      // Botón de siguiente mano
      document.getElementById('nextHandBtn').addEventListener('click', () => {
        const winnerSelect = document.getElementById('winnerSelect');
        const winnerId = winnerSelect.value;
        
        if (winnerId && this.state.roomId) {
          SocketClient.nextHand(this.state.roomId, winnerId);
        } else {
          UIUtils.showMessage('Selecciona un ganador', 'error');
        }
      });
      
      // Inicializar eventos de acciones
      this.components.actions.initEvents((action, amount) => {
        SocketClient.playerAction(this.state.roomId, action, amount);
      });
    },
    
    // Manejar eventos de Socket.IO
    handleSocketEvents(eventName, data) {
      switch (eventName) {
        case 'roomJoined':
          this.handleRoomJoined(data);
          break;
          
        case 'roomState':
          this.handleRoomState(data);
          break;
          
        case 'gameState':
          this.handleGameState(data);
          break;
          
        case 'playerTurn':
          this.handlePlayerTurn(data);
          break;
          
        case 'handResult':
          this.handleHandResult(data);
          break;
          
        case 'gameMessage':
          UIUtils.showMessage(data.message);
          break;
          
        case 'gameError':
          UIUtils.showMessage(data.message, 'error');
          break;
      }
    },
    
    // Manejar evento de unirse a sala
    handleRoomJoined(data) {
      if (data.success) {
        this.state.roomId = data.roomId;
        this.state.playerId = data.playerId;
        
        // Actualizar UI
        document.getElementById('currentRoom').textContent = data.roomId;
        
        // Cambiar a pantalla de juego
        this.switchToScreen('gameScreen');
        
        UIUtils.showMessage(`Te has unido a la sala ${data.roomId}`);
      }
    },
    
    // Manejar actualización de estado de sala
    handleRoomState(data) {
      // Actualizar estado local
      this.state.players = data.players;
      this.state.currentTurn = data.currentTurn;
      this.state.pot = data.pot;
      this.state.currentBet = data.currentBet;
      this.state.currentPhase = data.currentPhase;
      
      // Actualizar UI
      this.updateUI();
      
      // Actualizar botón de listo
      const readyBtn = document.getElementById('readyBtn');
      const player = data.players[this.state.playerId];
      
      if (player) {
        this.state.isReady = player.isReady;
        readyBtn.disabled = player.isReady;
        readyBtn.innerHTML = player.isReady ? 
          '<i class="fas fa-check-circle"></i> Listo' : 
          '<i class="fas fa-check-circle"></i> ¡Listo!';
        
        // Mostrar/ocultar controles de mano
        const handControl = document.getElementById('handControl');
        handControl.style.display = (data.currentPhase === 'showdown') ? 'block' : 'none';
        
        // Actualizar balance del jugador
        document.getElementById('playerBalance').textContent = player.balance;
        
        // Actualizar estado del jugador
        if (player.folded) {
          UIUtils.updatePlayerStatus('Te has retirado');
        } else if (this.state.currentTurn === this.state.playerId) {
          UIUtils.updatePlayerStatus('¡Tu turno!');
        } else if (player.isReady && this.state.currentPhase === 'waiting') {
          UIUtils.updatePlayerStatus('Esperando a otros jugadores...');
        } else {
          UIUtils.updatePlayerStatus('Esperando tu turno...');
        }
      }
      
      // Actualizar selector de ganadores
      const winnerSelect = document.getElementById('winnerSelect');
      winnerSelect.innerHTML = '';
      
      for (const playerId in data.players) {
        const player = data.players[playerId];
        if (!player.folded) {
          const option = document.createElement('option');
          option.value = playerId;
          option.textContent = player.name;
          winnerSelect.appendChild(option);
        }
      }
      
      // Actualizar fase del juego
      let phaseText = 'Esperando jugadores';
      switch (data.currentPhase) {
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
    },
    
    // Manejar actualización del estado del juego
    handleGameState(data) {
      // Actualizar estado local
      this.state.pot = data.pot;
      this.state.currentBet = data.currentBet;
      this.state.currentTurn = data.currentTurn;
      this.state.currentPhase = data.currentPhase;
      
      // Actualizar UI
      document.getElementById('potAmount').textContent = data.pot;
      document.getElementById('currentBet').textContent = data.currentBet;
      
      // Actualizar jugadores
      this.updatePlayersUI(data.players);
    },
    
    // Manejar turno de jugador
    handlePlayerTurn(data) {
      if (this.state.playerId === this.state.currentTurn) {
        // Es nuestro turno, mostrar opciones
        this.components.actions.showActions(data.options, this.state.players[this.state.playerId]);
        
        // Iniciar temporizador
        this.components.actions.startTimer(data.timeLimit || 30);
        
        // Mostrar mensaje
        UIUtils.showMessage('¡Es tu turno!', 'system');
        
        // Reproducir sonido o animación (si existe)
        UIUtils.animateElement(document.querySelector('.current-player'), 'pulse', 1000);
      } else {
        // Turno de otro jugador
        const currentPlayer = this.state.players[this.state.currentTurn];
        if (currentPlayer) {
          // Mostrar notificación
          UIUtils.showTurnNotification(currentPlayer.name);
        }
      }
    },
    
    // Manejar resultado de mano
    handleHandResult(data) {
      const winnerName = data.winner.name;
      const potAmount = data.pot;
      
      // Mostrar mensaje
      UIUtils.showMessage(`¡${winnerName} gana ${potAmount}€!`, 'system');
      
      // Resetear estado de listo
      this.state.isReady = false;
      
      // Habilitar botón de listo
      document.getElementById('readyBtn').disabled = false;
      document.getElementById('readyBtn').innerHTML = '<i class="fas fa-check-circle"></i> ¡Listo!';
      
      // Ocultar área de acciones
      this.components.actions.hideActions();
      
      // Animar al ganador (si está implementado)
      const winnerId = data.winner.id;
      if (this.components.players[winnerId]) {
        UIUtils.highlightWinner(winnerId, this.components.players);
      }
    },
    
    // Actualizar interfaz de usuario
    updateUI() {
      // Actualizar información del bote
      document.getElementById('potAmount').textContent = this.state.pot;
      document.getElementById('currentBet').textContent = this.state.currentBet;
      
      // Actualizar jugadores
      this.updatePlayersUI(this.state.players);
    },
    
    // Actualizar UI de jugadores
    updatePlayersUI(players) {
      // Obtener el contenedor de jugadores
      const container = document.getElementById('playersContainer');
      
      // Limpiar los componentes de jugadores existentes
      this.components.players = {};
      container.innerHTML = '';
      
      // Calcular posiciones para los jugadores
      const positions = this.calculatePlayerPositions(Object.keys(players).length);
      
      // Crear componentes de jugadores
      let index = 0;
      for (const playerId in players) {
        const player = players[playerId];
        const position = positions[index];
        
        // Crear componente de jugador
        const playerComponent = new Player(player, playerId === this.state.playerId);
        
        // Configurar posición y estado
        playerComponent.setPosition(position.left, position.top);
        playerComponent.setActive(playerId === this.state.currentTurn);
        
        // Añadir al DOM
        container.appendChild(playerComponent.element);
        
        // Guardar referencia
        this.components.players[playerId] = playerComponent;
        
        index++;
      }
    },
    
    // Calcular posiciones para los jugadores alrededor de la mesa
    calculatePlayerPositions(playerCount) {
      const positions = [];
      const centerX = 50; // Porcentaje
      const centerY = 50; // Porcentaje
      const radius = 40;  // Porcentaje
      
      // Calcular posiciones en círculo
      for (let i = 0; i < playerCount; i++) {
        // Ángulo en radianes (empezando desde arriba y en sentido horario)
        const angle = (Math.PI * 2 * i / playerCount) - Math.PI / 2;
        
        // Calcular posición
        const left = centerX + radius * Math.cos(angle);
        const top = centerY + radius * Math.sin(angle);
        
        positions.push({ left, top });
      }
      
      return positions;
    },
    
    // Cambiar entre pantallas
    switchToScreen(screenId) {
      // Ocultar todas las pantallas
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });
      
      // Mostrar la pantalla solicitada
      document.getElementById(screenId).classList.add('active');
    },
    
    // Resetear estado de la aplicación
    resetState() {
      this.state = {
        roomId: null,
        playerId: null,
        players: {},
        currentTurn: null,
        pot: 0,
        currentBet: 0,
        currentPhase: 'waiting',
        isReady: false
      };
      
      this.components.players = {};
      this.components.actions.hideActions();
      
      // Limpiar UI
      document.getElementById('playersContainer').innerHTML = '';
      document.getElementById('gameMessages').innerHTML = '';
      document.getElementById('playerBalance').textContent = '0';
      document.getElementById('playerStatus').textContent = 'Esperando';
    }
  };
  
  // Inicializar la aplicación cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });