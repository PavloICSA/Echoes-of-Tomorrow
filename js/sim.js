/**
 * Game simulation and state management
 */

class GameState {
  constructor() {
    this.variables = {
      ecology: 50,
      cohesion: 50,
      innovation: 50,
      stability: 50
    };
    this.turn = 1;
    this.victoryCounter = 0;
    this.gameStatus = 'playing'; // 'playing', 'victory', 'collapse'
    this.qualityMode = 'medium'; // 'low', 'medium', 'high'
    this.audioMuted = false;
    
    // Interpolation state
    this.isInterpolating = false;
    this.interpolationStart = 0;
    this.interpolationDuration = 0;
    this.interpolationStartValues = {};
    this.interpolationTargetValues = {};
  }

  /**
   * Apply card effects to variables with variance
   * @param {Object} card - Card object with effects
   * @param {number} variance - Random variance to apply
   */
  applyCardEffects(card, variance = 0) {
    if (!card || !card.effects) return;

    const effects = {};
    for (const [key, value] of Object.entries(card.effects)) {
      const randomVariance = (Math.random() - 0.5) * 2 * variance;
      effects[key] = value + randomVariance;
    }

    // Start interpolation
    this.interpolationStartValues = { ...this.variables };
    this.interpolationTargetValues = {};

    for (const [key, effect] of Object.entries(effects)) {
      const newValue = this.variables[key] + effect;
      this.interpolationTargetValues[key] = clamp(newValue, 0, 100);
    }

    this.isInterpolating = true;
    this.interpolationStart = performance.now();
    this.interpolationDuration = 500 + Math.random() * 700; // 500-1200ms
  }

  /**
   * Update interpolation progress
   * @param {number} currentTime - Current timestamp
   */
  updateInterpolation(currentTime) {
    if (!this.isInterpolating) return;

    const elapsed = currentTime - this.interpolationStart;
    const progress = Math.min(elapsed / this.interpolationDuration, 1);

    // Apply easing
    const easedProgress = easeInOutQuad(progress);

    // Interpolate each variable
    for (const [key, targetValue] of Object.entries(this.interpolationTargetValues)) {
      const startValue = this.interpolationStartValues[key];
      this.variables[key] = startValue + (targetValue - startValue) * easedProgress;
    }

    // Check if interpolation is complete
    if (progress >= 1) {
      this.isInterpolating = false;
      // Snap to target values
      for (const [key, targetValue] of Object.entries(this.interpolationTargetValues)) {
        this.variables[key] = targetValue;
      }
    }
  }

  /**
   * Check if victory condition is met
   * @returns {boolean} True if all variables >= 80 for 5 consecutive turns
   */
  checkVictoryCondition() {
    const allHigh = Object.values(this.variables).every(v => v >= 80);
    
    if (allHigh) {
      this.victoryCounter++;
      if (this.victoryCounter >= 5) {
        this.gameStatus = 'victory';
        return true;
      }
    } else {
      this.victoryCounter = 0;
    }
    
    return false;
  }

  /**
   * Check if collapse condition is met
   * @returns {boolean} True if any variable <= 5
   */
  checkCollapseCondition() {
    const anyLow = Object.values(this.variables).some(v => v <= 5);
    
    if (anyLow) {
      this.gameStatus = 'collapse';
      return true;
    }
    
    return false;
  }

  /**
   * Advance to next turn
   */
  advanceTurn() {
    this.turn++;
  }

  /**
   * Reset game state to initial values
   */
  reset() {
    this.variables = {
      ecology: 50,
      cohesion: 50,
      innovation: 50,
      stability: 50
    };
    this.turn = 1;
    this.victoryCounter = 0;
    this.gameStatus = 'playing';
    this.isInterpolating = false;
  }

  /**
   * Get current variables as normalized [0, 1] values
   * @returns {Object} Normalized variables
   */
  getNormalizedVariables() {
    return {
      ecology: normalize(this.variables.ecology),
      cohesion: normalize(this.variables.cohesion),
      innovation: normalize(this.variables.innovation),
      stability: normalize(this.variables.stability)
    };
  }
}

// Global game state instance
let gameState = new GameState();
