/**
 * Main application bootstrap and game loop
 */

let cardPool = [];
let gameLoopId = null;
let lastFrameTime = 0;
let isProcessingInput = false;

// Performance monitoring
let frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67, // 60 FPS target (1000ms / 60)
  warningLogged: false
};

/**
 * Initialize the game
 */
async function initGame() {
  try {
    // Load cards
    await loadCards();

    // Initialize visuals
    const visualizationContainer = document.getElementById('visualization');
    visualsManager = new VisualsManager(visualizationContainer);

    // Initialize audio
    audioManager.initialize();

    // Draw initial cards
    drawNewCards();

    // Render initial UI
    uiManager.renderMetricBar(gameState.variables);
    uiManager.updateMetricAria(gameState.variables);
    uiManager.updateTurnCounter(gameState.turn);

    // Set up event listeners
    setupEventListeners();

    // Start game loop
    startGameLoop();

    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

/**
 * Load cards from cards.json
 */
async function loadCards() {
  try {
    const response = await fetch('js/cards.json');
    if (!response.ok) throw new Error('Failed to load cards.json');
    cardPool = await response.json();
    console.log(`Loaded ${cardPool.length} cards`);
  } catch (error) {
    console.error('Error loading cards:', error);
    // Provide fallback card pool
    cardPool = getDefaultCardPool();
  }
}

/**
 * Get default card pool if loading fails
 */
function getDefaultCardPool() {
  return [
    {
      id: 'renewable-energy',
      title: 'Renewable Energy',
      desc: 'Invest in solar and wind power',
      effects: { ecology: 8, cohesion: 2, innovation: 5, stability: 3 },
      variance: 2
    },
    {
      id: 'education',
      title: 'Global Education',
      desc: 'Expand access to learning',
      effects: { ecology: 2, cohesion: 6, innovation: 8, stability: 4 },
      variance: 2
    },
    {
      id: 'conflict-resolution',
      title: 'Peace Talks',
      desc: 'Mediate international disputes',
      effects: { ecology: 1, cohesion: 8, innovation: 2, stability: 6 },
      variance: 2
    },
    {
      id: 'tech-innovation',
      title: 'Tech Breakthrough',
      desc: 'Accelerate technological progress',
      effects: { ecology: -2, cohesion: 3, innovation: 10, stability: 2 },
      variance: 2
    },
    {
      id: 'forest-conservation',
      title: 'Forest Protection',
      desc: 'Preserve natural ecosystems',
      effects: { ecology: 10, cohesion: 1, innovation: 1, stability: 2 },
      variance: 2
    },
    {
      id: 'cultural-exchange',
      title: 'Cultural Exchange',
      desc: 'Promote cross-cultural understanding',
      effects: { ecology: 1, cohesion: 7, innovation: 4, stability: 3 },
      variance: 2
    },
    {
      id: 'economic-reform',
      title: 'Economic Reform',
      desc: 'Redistribute wealth fairly',
      effects: { ecology: 2, cohesion: 5, innovation: 3, stability: -3 },
      variance: 2
    },
    {
      id: 'pandemic-response',
      title: 'Health Initiative',
      desc: 'Improve global health systems',
      effects: { ecology: 1, cohesion: 4, innovation: 3, stability: 5 },
      variance: 2
    },
    {
      id: 'climate-action',
      title: 'Climate Action',
      desc: 'Combat climate change',
      effects: { ecology: 9, cohesion: 3, innovation: 4, stability: 1 },
      variance: 2
    },
    {
      id: 'war',
      title: 'Military Conflict',
      desc: 'Armed conflict erupts',
      effects: { ecology: -5, cohesion: -8, innovation: 2, stability: -6 },
      variance: 2
    }
  ];
}

/**
 * Draw three new cards for the current turn
 */
function drawNewCards() {
  const newCards = getNextThreeCards(cardPool, uiManager.currentCards);
  uiManager.renderCardPanel(newCards);
}

/**
 * Handle card selection
 */
function handleCardSelect(cardIndex) {
  if (gameState.gameStatus !== 'playing' || gameState.isInterpolating || isProcessingInput) {
    return;
  }

  isProcessingInput = true;

  const card = uiManager.currentCards[cardIndex];
  if (!card) return;

  // Apply card effects
  gameState.applyCardEffects(card, card.variance || 0);

  // Show system message
  const message = formatMessage(card, card.effects);
  uiManager.renderSystemMessage(message);

  // After interpolation completes, check conditions and advance turn
  const checkInterval = setInterval(() => {
    if (!gameState.isInterpolating) {
      clearInterval(checkInterval);

      // Update UI
      uiManager.renderMetricBar(gameState.variables);
      uiManager.updateMetricAria(gameState.variables);

      // Check win/loss conditions
      if (gameState.checkVictoryCondition()) {
        visualsManager.animateVictory();
        audioManager.playVictorySound();
        uiManager.announceToScreenReader('Victory! All civilization variables have reached harmony.');
        setTimeout(() => {
          uiManager.showVictoryScreen();
        }, 500);
      } else if (gameState.checkCollapseCondition()) {
        visualsManager.animateCollapse();
        audioManager.playCollapseSound();
        uiManager.announceToScreenReader('Civilization collapsed. One or more variables fell below critical threshold.');
        setTimeout(() => {
          uiManager.showGameOverScreen();
        }, 500);
      } else {
        // Advance turn and draw new cards
        gameState.advanceTurn();
        uiManager.updateTurnCounter(gameState.turn);
        drawNewCards();
      }

      isProcessingInput = false;
    }
  }, 16); // Check every frame
}

/**
 * Handle restart
 */
function handleRestart() {
  gameState.reset();
  uiManager.hideModals();
  uiManager.hideHelpScreen();
  uiManager.renderMetricBar(gameState.variables);
  uiManager.updateMetricAria(gameState.variables);
  uiManager.updateTurnCounter(gameState.turn);
  drawNewCards();
  uiManager.renderSystemMessage('Game restarted. Choose wisely.');
  uiManager.announceToScreenReader('Game restarted. All variables reset to 50.');
  visualsManager.victoryMorphProgress = 0;
  visualsManager.collapseMorphProgress = 0;
  visualsManager.uniforms.u_victoryMorph.value = 0;
  visualsManager.uniforms.u_collapseMorph.value = 0;
  audioManager.resumeContext();
  isProcessingInput = false;
}

/**
 * Handle screenshot export
 */
function handleScreenshot() {
  visualsManager.exportCanvas();
  uiManager.renderSystemMessage('Screenshot saved!');
}

/**
 * Handle quality mode toggle
 */
function handleQualityToggle() {
  const modes = ['low', 'medium', 'high'];
  const currentIndex = modes.indexOf(gameState.qualityMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  gameState.qualityMode = modes[nextIndex];
  uiManager.updateQualityDisplay(gameState.qualityMode);
  
  // Update visuals with new quality mode
  if (visualsManager) {
    visualsManager.updateQualityMode(gameState.qualityMode);
  }
}

/**
 * Handle mute toggle
 */
function handleMuteToggle() {
  gameState.audioMuted = !gameState.audioMuted;
  audioManager.setMute(gameState.audioMuted);
  uiManager.updateMuteDisplay(gameState.audioMuted);
}

/**
 * Handle help toggle
 */
function handleHelpToggle() {
  const helpScreen = document.getElementById('helpScreen');
  if (helpScreen && helpScreen.classList.contains('hidden')) {
    uiManager.showHelpScreen();
  } else {
    uiManager.hideHelpScreen();
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Resume audio context on first user interaction (required by modern browsers)
  const resumeAudioOnInteraction = () => {
    audioManager.resumeContext();
    document.removeEventListener('click', resumeAudioOnInteraction);
    document.removeEventListener('keydown', resumeAudioOnInteraction);
  };
  document.addEventListener('click', resumeAudioOnInteraction);
  document.addEventListener('keydown', resumeAudioOnInteraction);

  // Button clicks
  document.getElementById('restartBtn').addEventListener('click', handleRestart);
  document.getElementById('victoryRestartBtn').addEventListener('click', handleRestart);
  document.getElementById('gameOverRestartBtn').addEventListener('click', handleRestart);
  document.getElementById('screenshotBtn').addEventListener('click', handleScreenshot);
  document.getElementById('qualityToggle').addEventListener('click', handleQualityToggle);
  document.getElementById('muteBtn').addEventListener('click', handleMuteToggle);
  document.getElementById('helpBtn').addEventListener('click', handleHelpToggle);
  document.getElementById('helpCloseBtn').addEventListener('click', handleHelpToggle);

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === '1') handleCardSelect(0);
    if (e.key === '2') handleCardSelect(1);
    if (e.key === '3') handleCardSelect(2);
    if (e.key === 'r' || e.key === 'R') handleRestart();
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      handleScreenshot();
    }
    if (e.key === 'm' || e.key === 'M') handleMuteToggle();
    if (e.key === '?' || e.key === '/') {
      e.preventDefault();
      handleHelpToggle();
    }
  });

  // Close help modal when clicking outside
  document.getElementById('helpScreen').addEventListener('click', (e) => {
    if (e.target.id === 'helpScreen') {
      handleHelpToggle();
    }
  });

  // Close victory/game over modals when clicking outside
  document.getElementById('victoryScreen').addEventListener('click', (e) => {
    if (e.target.id === 'victoryScreen') {
      handleRestart();
    }
  });

  document.getElementById('gameOverScreen').addEventListener('click', (e) => {
    if (e.target.id === 'gameOverScreen') {
      handleRestart();
    }
  });
}

/**
 * Start the game loop
 */
function startGameLoop() {
  const loop = (currentTime) => {
    // Monitor frame time
    const frameStartTime = performance.now();
    
    // Throttle rendering if tab is inactive
    if (!document.hidden) {
      // Update game state
      gameState.updateInterpolation(currentTime);

      // Update UI
      uiManager.renderMetricBar(gameState.variables);
      uiManager.updateMetricAria(gameState.variables);

      // Update visuals
      visualsManager.updateUniforms(gameState.variables);
      visualsManager.render();

      // Update audio
      audioManager.updateAudio(gameState.variables);
    }

    // Calculate frame time
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - frameStartTime;
    
    // Update frame time statistics
    updateFrameTimeMonitor(frameTime);

    gameLoopId = requestAnimationFrame(loop);
  };

  gameLoopId = requestAnimationFrame(loop);
}

/**
 * Update frame time monitoring statistics
 * @param {number} frameTime - Time taken to render this frame in milliseconds
 */
function updateFrameTimeMonitor(frameTime) {
  frameTimeMonitor.frameCount++;
  frameTimeMonitor.totalFrameTime += frameTime;
  frameTimeMonitor.maxFrameTime = Math.max(frameTimeMonitor.maxFrameTime, frameTime);

  // Log warning if frame time exceeds threshold
  if (frameTime > frameTimeMonitor.warningThreshold) {
    if (!frameTimeMonitor.warningLogged || frameTimeMonitor.frameCount % 60 === 0) {
      console.warn(
        `Frame time exceeded 60 FPS target: ${frameTime.toFixed(2)}ms ` +
        `(target: ${frameTimeMonitor.warningThreshold.toFixed(2)}ms)`
      );
      frameTimeMonitor.warningLogged = true;
    }
  } else {
    frameTimeMonitor.warningLogged = false;
  }

  // Log average frame time every 300 frames (~5 seconds at 60 FPS)
  if (frameTimeMonitor.frameCount % 300 === 0) {
    const avgFrameTime = frameTimeMonitor.totalFrameTime / frameTimeMonitor.frameCount;
    const fps = 1000 / avgFrameTime;
    console.log(
      `Performance: Avg ${avgFrameTime.toFixed(2)}ms/frame (${fps.toFixed(1)} FPS), ` +
      `Max ${frameTimeMonitor.maxFrameTime.toFixed(2)}ms`
    );
  }
}

/**
 * Stop the game loop
 */
function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

// Clean up on page unload
window.addEventListener('beforeunload', stopGameLoop);
