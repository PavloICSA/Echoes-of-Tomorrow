/**
 * Utility functions for Echoes of Tomorrow
 */

/**
 * Seeded random number generator for reproducible demos
 * @param {number} seed - Seed value
 * @returns {number} Random number between 0 and 1
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Easing function: easeInOutQuad
 * @param {number} t - Time value (0 to 1)
 * @returns {number} Eased value
 */
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Clamp a value to a range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a value from [0, 100] to [0, 1]
 * @param {number} value - Value to normalize
 * @returns {number} Normalized value
 */
function normalize(value) {
  return clamp(value, 0, 100) / 100;
}

/**
 * Draw a random card from the pool, excluding specified cards
 * @param {Array} cardPool - Array of card objects
 * @param {Array} exclude - Array of card IDs to exclude
 * @returns {Object} Random card object
 */
function drawCard(cardPool, exclude = []) {
  const available = cardPool.filter(card => !exclude.includes(card.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Generate a system message based on card effects
 * @param {Object} card - Card object
 * @param {Object} effects - Applied effects
 * @returns {string} System message
 */
function formatMessage(card, effects) {
  const messages = [];
  
  if (effects.ecology > 0) messages.push(`Ecology surges +${effects.ecology}`);
  else if (effects.ecology < 0) messages.push(`Ecology declines ${effects.ecology}`);
  
  if (effects.cohesion > 0) messages.push(`Cohesion strengthens +${effects.cohesion}`);
  else if (effects.cohesion < 0) messages.push(`Cohesion weakens ${effects.cohesion}`);
  
  if (effects.innovation > 0) messages.push(`Innovation accelerates +${effects.innovation}`);
  else if (effects.innovation < 0) messages.push(`Innovation stalls ${effects.innovation}`);
  
  if (effects.stability > 0) messages.push(`Stability solidifies +${effects.stability}`);
  else if (effects.stability < 0) messages.push(`Stability crumbles ${effects.stability}`);
  
  return messages.slice(0, 2).join('. ') || 'Echo sent.';
}

/**
 * Check if a value is NaN and return default if so
 * @param {number} value - Value to check
 * @param {number} defaultValue - Default value if NaN
 * @returns {number} Value or default
 */
function safeNumber(value, defaultValue = 0) {
  return isNaN(value) ? defaultValue : value;
}

/**
 * Get the next three cards for a turn, ensuring no duplicates
 * @param {Array} cardPool - Full pool of available cards
 * @param {Array} previousCards - Previously drawn cards to exclude
 * @returns {Array} Array of 3 unique card objects
 */
function getNextThreeCards(cardPool, previousCards = []) {
  if (!cardPool || cardPool.length === 0) {
    return [];
  }

  const excludeIds = previousCards.map(c => c.id);
  const nextCards = [];

  // Draw 3 unique cards
  for (let i = 0; i < 3; i++) {
    const card = drawCard(cardPool, excludeIds);
    if (card) {
      nextCards.push(card);
      excludeIds.push(card.id);
    }
  }

  return nextCards;
}

/**
 * Performance monitoring utilities
 */

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for logging
 * @returns {*} Function result
 */
function measurePerformance(fn, label = 'Operation') {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 1) {
    console.warn(`${label} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Get current performance metrics
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
  const memory = performance.memory ? {
    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  } : null;
  
  return {
    timestamp: performance.now(),
    memory: memory,
    isTabActive: !document.hidden
  };
}

/**
 * Log performance metrics to console
 */
function logPerformanceMetrics() {
  const metrics = getPerformanceMetrics();
  console.log('Performance Metrics:', metrics);
}
