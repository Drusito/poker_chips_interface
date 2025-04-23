/**
 * Componente de Acciones del jugador
 */

class Actions {
    /**
     * Constructor
     */
    constructor() {
      this.actionArea = document.getElementById('actionArea');
      this.timerInterval = null;
      this.callback = null;
      this.betSliderListener = null;
    }
    
    /**
     * Inicializa los eventos de los botones
     * @param {Function} callback - Función a llamar cuando se realiza una acción
     */
    initEvents(callback) {
      this.callback = callback;
      
      // Configurar eventos de botones
      document.getElementById('foldBtn').addEventListener('click', () => {
        this.executeAction('fold');
      });
      
      document.getElementById('checkBtn').addEventListener('click', () => {
        this.executeAction('check');
      });
      
      document.getElementById('callBtn').addEventListener('click', () => {
        this.executeAction('call');
      });
      
      document.getElementById('betBtn').addEventListener('click', () => {
        const amount = parseInt(document.getElementById('betAmount').textContent);
        this.executeAction('bet', amount);
      });
      
      document.getElementById('raiseBtn').addEventListener('click', () => {
        const amount = parseInt(document.getElementById('betAmount').textContent);
        this.executeAction('raise', amount);
      });
      
      document.getElementById('allInBtn').addEventListener('click', () => {
        this.executeAction('allIn');
      });
    }
    
    /**
     * Ejecuta una acción
     * @param {string} action - Tipo de acción
     * @param {number} amount - Cantidad (opcional)
     */
    executeAction(action, amount = 0) {
      if (this.callback) {
        this.callback(action, amount);
      }
      
      // Ocultar área de acciones
      this.hideActions();
      
      // Detener temporizador
      this.stopTimer();
    }
    
    /**
     * Muestra las opciones de acción disponibles
     * @param {Object} options - Opciones disponibles
     * @param {Object} player - Datos del jugador
     */
    showActions(options, player) {
      // Mostrar área de acciones
      this.actionArea.classList.remove('hidden');
      
      // Configurar botones según opciones disponibles
      document.getElementById('foldBtn').disabled = !options.fold;
      document.getElementById('checkBtn').disabled = !options.check;
      
      // Botón de call
      const callBtn = document.getElementById('callBtn');
      const callAmount = document.getElementById('callAmount');
      
      if (options.call) {
        callBtn.disabled = false;
        callAmount.textContent = options.call.amount + '€';
      } else {
        callBtn.disabled = true;
        callAmount.textContent = '';
      }
      
      // Configurar apuesta
      const betControls = document.querySelector('.bet-controls');
      const betBtn = document.getElementById('betBtn');
      const betSlider = document.getElementById('betSlider');
      
      // Eliminar listener anterior si existe
      if (this.betSliderListener) {
        betSlider.removeEventListener('input', this.betSliderListener);
      }
      
      if (options.bet) {
        betBtn.disabled = false;
        betSlider.min = options.bet.min;
        betSlider.max = options.bet.max;
        betSlider.value = options.bet.min;
        document.getElementById('betAmount').textContent = options.bet.min;
        betControls.style.display = 'flex';
        
        // Crear y añadir nuevo listener
        this.betSliderListener = () => {
          document.getElementById('betAmount').textContent = betSlider.value;
        };
        betSlider.addEventListener('input', this.betSliderListener);
      } else {
        betBtn.disabled = true;
        betControls.style.display = 'none';
      }
      
      // Configurar raise
      const raiseBtn = document.getElementById('raiseBtn');
      const raiseAmount = document.getElementById('raiseAmount');
      
      if (options.raise) {
        raiseBtn.disabled = false;
        betSlider.min = options.raise.min;
        betSlider.max = options.raise.max;
        betSlider.value = options.raise.min;
        document.getElementById('betAmount').textContent = options.raise.min;
        raiseAmount.textContent = options.raise.min + '€';
        betControls.style.display = 'flex';
        
        // Si no hemos añadido aún el listener (porque no había opción de bet)
        if (!this.betSliderListener) {
          this.betSliderListener = () => {
            document.getElementById('betAmount').textContent = betSlider.value;
            raiseAmount.textContent = betSlider.value + '€';
          };
          betSlider.addEventListener('input', this.betSliderListener);
        }
      } else {
        raiseBtn.disabled = true;
        raiseAmount.textContent = '';
      }
      
      // Configurar all-in
      const allInBtn = document.getElementById('allInBtn');
      
      if (options.allIn) {
        allInBtn.disabled = false;
        const allInAmount = options.allIn.amount;
        allInBtn.innerHTML = `<i class="fas fa-fire"></i> All In <span>(${allInAmount}€)</span>`;
      } else {
        allInBtn.disabled = true;
        allInBtn.innerHTML = `<i class="fas fa-fire"></i> All In`;
      }
    }
    
    /**
     * Oculta el área de acciones
     */
    hideActions() {
      this.actionArea.classList.add('hidden');
      this.stopTimer();
    }
    
    /**
     * Inicia el temporizador para la acción
     * @param {number} seconds - Segundos disponibles
     */
    startTimer(seconds) {
      // Detener temporizador anterior si existe
      this.stopTimer();
      
      const timerBar = this.actionArea.querySelector('.timer-bar');
      const timerText = this.actionArea.querySelector('.timer-text');
      
      // Establecer tiempo inicial
      let timeLeft = seconds;
      timerText.textContent = timeLeft;
      timerBar.style.width = '100%';
      
      // Iniciar intervalo
      this.timerInterval = setInterval(() => {
        timeLeft--;
        
        // Actualizar UI
        timerText.textContent = timeLeft;
        timerBar.style.width = (timeLeft / seconds * 100) + '%';
        
        // Cambiar color según tiempo restante
        if (timeLeft <= 5) {
          timerBar.style.backgroundColor = '#dc3545';
        } else if (timeLeft <= 10) {
          timerBar.style.backgroundColor = '#ffc107';
        }
        
        // Tiempo agotado
        if (timeLeft <= 0) {
          // Ejecutar fold automático
          this.executeAction('fold');
          clearInterval(this.timerInterval);
        }
      }, 1000);
    }
    
    /**
     * Detiene el temporizador
     */
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }