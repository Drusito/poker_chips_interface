/**
 * Utilidades para la interfaz de usuario
 */

const UIUtils = {
    /**
     * Muestra un mensaje en el chat del juego
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje (normal, system, error)
     */
    showMessage(message, type = 'normal') {
      const messagesContainer = document.getElementById('gameMessages');
      
      // Crear elemento de mensaje
      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message');
      
      // Añadir clase según tipo
      if (type === 'system') {
        messageElement.classList.add('system');
      } else if (type === 'error') {
        messageElement.classList.add('error');
      }
      
      // Establecer contenido
      messageElement.textContent = message;
      
      // Añadir al contenedor
      messagesContainer.appendChild(messageElement);
      
      // Hacer scroll hacia abajo
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    /**
     * Actualiza el estado del jugador
     * @param {string} status - Estado a mostrar
     */
    updatePlayerStatus(status) {
      document.getElementById('playerStatus').textContent = status;
    },
    
    /**
     * Formatea un valor de moneda
     * @param {number} value - Valor a formatear
     * @returns {string} - Valor formateado
     */
    formatCurrency(value) {
      return value.toLocaleString() + '€';
    },
    
    /**
     * Animación de fichas moviéndose al bote
     * @param {number} startX - Posición X inicial
     * @param {number} startY - Posición Y inicial
     * @param {number} amount - Cantidad de fichas
     */
    animateChipsToPot(startX, startY, amount) {
      const table = document.querySelector('.poker-table');
      const pot = document.querySelector('.pot');
      
      // Obtener posición del bote
      const potRect = pot.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      
      // Posición destino (relativa a la mesa)
      const endX = (potRect.left + potRect.width / 2) - tableRect.left;
      const endY = (potRect.top + potRect.height / 2) - tableRect.top;
      
      // Crear fichas
      const chipCount = Math.min(5, Math.max(1, Math.floor(amount / 10)));
      
      for (let i = 0; i < chipCount; i++) {
        // Crear elemento de ficha
        const chip = document.createElement('div');
        chip.classList.add('chip-animation');
        chip.style.left = startX + 'px';
        chip.style.top = startY + 'px';
        
        // Colores según valor
        const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
        chip.style.backgroundColor = colors[i % colors.length];
        
        // Añadir a la mesa
        table.appendChild(chip);
        
        // Animar
        setTimeout(() => {
          chip.style.left = endX + 'px';
          chip.style.top = endY + 'px';
          chip.style.opacity = '0';
          
          // Eliminar después de la animación
          setTimeout(() => {
            chip.remove();
          }, 500);
        }, i * 100);
      }
    },
    
    /**
     * Animación para resaltar el ganador
     * @param {string} playerId - ID del jugador ganador
     * @param {Object} players - Componentes de jugadores
     */
    highlightWinner(playerId, players) {
      const playerElement = players[playerId]?.element;
      
      if (playerElement) {
        // Añadir clase para animación
        playerElement.classList.add('winner');
        
        // Animación de fichas al ganador
        const pot = document.querySelector('.pot');
        const potRect = pot.getBoundingClientRect();
        const playerRect = playerElement.getBoundingClientRect();
        
        // Crear fichas en el bote que se mueven al ganador
        const chipCount = 10;
        const table = document.querySelector('.poker-table');
        const tableRect = table.getBoundingClientRect();
        
        const startX = (potRect.left + potRect.width / 2) - tableRect.left;
        const startY = (potRect.top + potRect.height / 2) - tableRect.top;
        
        const endX = (playerRect.left + playerRect.width / 2) - tableRect.left;
        const endY = (playerRect.top + playerRect.height / 2) - tableRect.top;
        
        for (let i = 0; i < chipCount; i++) {
          const chip = document.createElement('div');
          chip.classList.add('chip-animation');
          chip.style.left = startX + 'px';
          chip.style.top = startY + 'px';
          
          // Colores según valor
          const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
          chip.style.backgroundColor = colors[i % colors.length];
          
          // Añadir a la mesa
          table.appendChild(chip);
          
          // Animar
          setTimeout(() => {
            chip.style.left = endX + 'px';
            chip.style.top = endY + 'px';
            chip.style.opacity = '0';
            
            // Eliminar después de la animación
            setTimeout(() => {
              chip.remove();
            }, 500);
          }, i * 100);
        }
        
        // Quitar clase después de la animación
        setTimeout(() => {
          playerElement.classList.remove('winner');
        }, 3000);
      }
    },
    
    /**
     * Muestra notificación de turno
     * @param {string} playerName - Nombre del jugador
     */
    showTurnNotification(playerName) {
      const notification = document.createElement('div');
      notification.classList.add('turn-notification');
      notification.textContent = `Turno de ${playerName}`;
      
      document.body.appendChild(notification);
      
      // Mostrar y ocultar con animación
      setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
          notification.classList.remove('show');
          
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 2000);
      }, 100);
    },
    
    /**
     * Aplica animación de entrada a un elemento
     * @param {HTMLElement} element - Elemento a animar
     * @param {string} animation - Nombre de la animación
     * @param {number} duration - Duración en ms
     */
    animateElement(element, animation, duration = 500) {
      element.style.animation = `${animation} ${duration}ms`;
      
      setTimeout(() => {
        element.style.animation = '';
      }, duration);
    }
  };