/**
 * UI rendering and interaction
 */

class UIManager {
  constructor() {
    this.currentCards = [];
    this.selectedCardIndex = null;
    this.systemMessages = [];
  }

  /**
   * Render the card panel with 3 cards
   * @param {Array} cards - Array of 3 card objects
   */
  renderCardPanel(cards) {
    const cardPanel = document.getElementById('cardPanel');
    cardPanel.innerHTML = '';
    this.currentCards = cards;

    cards.forEach((card, index) => {
      const cardEl = document.createElement('button');
      cardEl.className = 'card';
      cardEl.dataset.index = index;
      cardEl.setAttribute('aria-label', `Card ${index + 1}: ${card.title}. ${card.desc}`);
      cardEl.setAttribute('tabindex', '0');

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = card.title;

      const desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = card.desc;

      const effects = document.createElement('div');
      effects.className = 'card-effects';

      for (const [key, value] of Object.entries(card.effects)) {
        const effectEl = document.createElement('div');
        effectEl.className = 'effect';
        
        if (value > 0) {
          effectEl.classList.add('positive');
          effectEl.textContent = `${key}: +${Math.round(value)}`;
        } else if (value < 0) {
          effectEl.classList.add('negative');
          effectEl.textContent = `${key}: ${Math.round(value)}`;
        } else {
          effectEl.classList.add('neutral');
          effectEl.textContent = `${key}: 0`;
        }
        
        effects.appendChild(effectEl);
      }

      cardEl.appendChild(title);
      cardEl.appendChild(desc);
      cardEl.appendChild(effects);

      cardEl.addEventListener('click', () => {
        window.handleCardSelect(index);
      });

      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.handleCardSelect(index);
        }
      });

      cardEl.addEventListener('mouseenter', () => {
        this.highlightCard(index);
      });

      cardPanel.appendChild(cardEl);
    });
  }

  /**
   * Highlight a card on hover/selection
   * @param {number} index - Card index
   */
  highlightCard(index) {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
      if (i === index) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  /**
   * Render the metric bar with 4 variables
   * @param {Object} variables - Variables object
   */
  renderMetricBar(variables) {
    const metrics = ['ecology', 'cohesion', 'innovation', 'stability'];
    
    metrics.forEach(metric => {
      const value = variables[metric];
      const percentage = (value / 100) * 100;
      
      const bar = document.getElementById(`${metric}Bar`);
      const valueEl = document.getElementById(`${metric}Value`);
      
      if (bar) bar.style.width = percentage + '%';
      if (valueEl) valueEl.textContent = Math.round(value);
    });
  }

  /**
   * Update turn counter
   * @param {number} turn - Current turn number
   */
  updateTurnCounter(turn) {
    const turnCounter = document.getElementById('turnCounter');
    if (turnCounter) {
      turnCounter.textContent = `Turn: ${turn}`;
    }
  }

  /**
   * Display a system message
   * @param {string} message - Message text
   */
  renderSystemMessage(message) {
    const messageEl = document.getElementById('systemMessage');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.style.opacity = '1';
      
      // Fade out after 3 seconds
      setTimeout(() => {
        messageEl.style.opacity = '0.5';
      }, 3000);
    }
  }

  /**
   * Show victory screen
   */
  showVictoryScreen() {
    const screen = document.getElementById('victoryScreen');
    if (screen) {
      screen.classList.remove('hidden');
    }
  }

  /**
   * Show game over screen
   */
  showGameOverScreen() {
    const screen = document.getElementById('gameOverScreen');
    if (screen) {
      screen.classList.remove('hidden');
    }
  }

  /**
   * Hide all modal screens
   */
  hideModals() {
    const victoryScreen = document.getElementById('victoryScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    if (victoryScreen) victoryScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
  }

  /**
   * Update quality mode display
   * @param {string} mode - Quality mode ('low', 'medium', 'high')
   */
  updateQualityDisplay(mode) {
    const btn = document.getElementById('qualityToggle');
    if (btn) {
      const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      btn.textContent = `Quality: ${modeLabel}`;
    }
  }

  /**
   * Update mute button display
   * @param {boolean} muted - Is audio muted
   */
  updateMuteDisplay(muted) {
    const btn = document.getElementById('muteBtn');
    if (btn) {
      btn.textContent = muted ? '🔇' : '🔊';
      btn.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    }
  }

  /**
   * Show help screen
   */
  showHelpScreen() {
    const screen = document.getElementById('helpScreen');
    if (screen) {
      screen.classList.remove('hidden');
      // Focus the close button for accessibility
      setTimeout(() => {
        const closeBtn = document.getElementById('helpCloseBtn');
        if (closeBtn) closeBtn.focus();
      }, 100);
    }
  }

  /**
   * Hide help screen
   */
  hideHelpScreen() {
    const screen = document.getElementById('helpScreen');
    if (screen) {
      screen.classList.add('hidden');
    }
  }

  /**
   * Update metric ARIA attributes
   * @param {Object} variables - Variables object
   */
  updateMetricAria(variables) {
    const metrics = ['ecology', 'cohesion', 'innovation', 'stability'];
    
    metrics.forEach(metric => {
      const value = variables[metric];
      const bar = document.getElementById(`${metric}Bar`);
      
      if (bar) {
        bar.setAttribute('aria-valuenow', Math.round(value));
      }
    });
  }

  /**
   * Announce game state change to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Global UI manager instance
let uiManager = new UIManager();
