/**
 * Audio synthesis and management for Echoes of Tomorrow
 * Uses WebAudio API for procedural ambient sound generation
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isMuted = false;
    
    // Oscillators and gains
    this.masterGain = null;
    this.oscillators = [];
    this.gainNodes = [];
    this.noiseGain = null;
    this.noiseBuffer = null;
    this.noiseSource = null;
    
    // LFO (Low Frequency Oscillator) for modulation
    this.lfoOscillator = null;
    this.lfoGain = null;
    
    // Filters
    this.filter = null;
    
    // State tracking
    this.currentFrequencies = [110, 165, 220]; // Base frequencies (A2, E3, A3)
    this.targetFrequencies = [110, 165, 220];
    this.lastUpdateTime = 0;
    this.updateInterval = 100; // Update every 100ms
  }

  /**
   * Initialize the audio context and create audio nodes
   */
  initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.15; // Quiet ambient level
      this.masterGain.connect(this.audioContext.destination);

      // Create filter for smooth tone
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 2000;
      this.filter.connect(this.masterGain);

      // Create three harmonic oscillators
      for (let i = 0; i < 3; i++) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = this.currentFrequencies[i];

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1; // Soft volume per oscillator

        osc.connect(gain);
        gain.connect(this.filter);

        osc.start();
        this.oscillators.push(osc);
        this.gainNodes.push(gain);
      }

      // Create noise for texture
      this.createNoiseOscillator();

      // Create LFO for subtle modulation
      this.createLFO();

      this.isInitialized = true;
      console.log('Audio manager initialized');
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Create a noise oscillator for texture
   */
  createNoiseOscillator() {
    try {
      // Create noise buffer
      const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }

      this.noiseBuffer = noiseBuffer;

      // Create noise source and gain
      this.noiseGain = this.audioContext.createGain();
      this.noiseGain.gain.value = 0.02; // Very subtle noise
      this.noiseGain.connect(this.filter);

      // Start noise loop
      this.playNoiseLoop();
    } catch (error) {
      console.warn('Failed to create noise oscillator:', error);
    }
  }

  /**
   * Play noise in a loop
   */
  playNoiseLoop() {
    if (!this.noiseBuffer || !this.noiseGain) return;

    try {
      // Stop previous noise source if it exists
      if (this.noiseSource) {
        this.noiseSource.stop();
      }

      // Create and start new noise source
      this.noiseSource = this.audioContext.createBufferSource();
      this.noiseSource.buffer = this.noiseBuffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.noiseGain);
      this.noiseSource.start();
    } catch (error) {
      console.warn('Failed to play noise loop:', error);
    }
  }

  /**
   * Create a Low Frequency Oscillator for subtle modulation
   */
  createLFO() {
    try {
      this.lfoOscillator = this.audioContext.createOscillator();
      this.lfoOscillator.type = 'sine';
      this.lfoOscillator.frequency.value = 0.5; // 0.5 Hz = slow modulation

      this.lfoGain = this.audioContext.createGain();
      this.lfoGain.gain.value = 20; // Modulation depth in Hz

      this.lfoOscillator.connect(this.lfoGain);

      // Connect LFO to filter frequency for subtle sweep
      this.lfoGain.connect(this.filter.frequency);

      this.lfoOscillator.start();
    } catch (error) {
      console.warn('Failed to create LFO:', error);
    }
  }

  /**
   * Update audio based on civilization variables
   * @param {Object} variables - Current civilization variables (0-100)
   */
  updateAudio(variables) {
    if (!this.isInitialized || !this.audioContext) return;

    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return; // Throttle updates
    }
    this.lastUpdateTime = now;

    try {
      // Map variables to frequencies
      // Ecology (0-100) -> Base frequency (110-220 Hz, A2-A3)
      const ecologyFreq = 110 + (variables.ecology / 100) * 110;

      // Cohesion (0-100) -> Second harmonic (165-330 Hz, E3-E4)
      const cohesionFreq = 165 + (variables.cohesion / 100) * 165;

      // Innovation (0-100) -> Third harmonic (220-440 Hz, A3-A4)
      const innovationFreq = 220 + (variables.innovation / 100) * 220;

      // Stability (0-100) -> Filter cutoff (1000-4000 Hz)
      const stabilityFilter = 1000 + (variables.stability / 100) * 3000;

      // Smoothly transition to target frequencies
      this.targetFrequencies = [ecologyFreq, cohesionFreq, innovationFreq];

      // Update oscillator frequencies with smooth exponential ramp
      for (let i = 0; i < this.oscillators.length; i++) {
        const osc = this.oscillators[i];
        const targetFreq = this.targetFrequencies[i];

        // Use exponential ramp for smooth frequency transitions
        osc.frequency.exponentialRampToValueAtTime(
          targetFreq,
          this.audioContext.currentTime + 0.5 // 500ms transition
        );
      }

      // Update filter frequency
      this.filter.frequency.exponentialRampToValueAtTime(
        stabilityFilter,
        this.audioContext.currentTime + 0.5
      );

      // Adjust noise gain based on stability (low stability = more noise)
      if (this.noiseGain) {
        const noiseAmount = (100 - variables.stability) / 100 * 0.1; // 0-0.1
        this.noiseGain.gain.exponentialRampToValueAtTime(
          Math.max(0.01, noiseAmount),
          this.audioContext.currentTime + 0.5
        );
      }

      // Adjust LFO depth based on innovation (high innovation = faster modulation)
      if (this.lfoOscillator) {
        const lfoFreq = 0.2 + (variables.innovation / 100) * 1.8; // 0.2-2 Hz
        this.lfoOscillator.frequency.exponentialRampToValueAtTime(
          lfoFreq,
          this.audioContext.currentTime + 0.5
        );
      }

      // Adjust master volume based on cohesion (high cohesion = louder)
      const targetVolume = (variables.cohesion / 100) * 0.2; // 0-0.2
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.05, targetVolume),
        this.audioContext.currentTime + 0.5
      );
    } catch (error) {
      console.warn('Error updating audio:', error);
    }
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    if (!this.isInitialized) return this.isMuted;

    try {
      this.isMuted = !this.isMuted;

      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : 0.15;
      }

      return this.isMuted;
    } catch (error) {
      console.warn('Error toggling mute:', error);
      return this.isMuted;
    }
  }

  /**
   * Set mute state explicitly
   * @param {boolean} muted - Whether to mute
   */
  setMute(muted) {
    if (!this.isInitialized) return;

    try {
      this.isMuted = muted;

      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : 0.15;
      }
    } catch (error) {
      console.warn('Error setting mute:', error);
    }
  }

  /**
   * Play a victory sound effect
   */
  playVictorySound() {
    if (!this.isInitialized || !this.audioContext) return;

    try {
      // Create a short ascending arpeggio
      const now = this.audioContext.currentTime;
      const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
      const noteDuration = 0.2;

      for (let i = 0; i < notes.length; i++) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = notes[i];

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.2, now + i * noteDuration);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + i * noteDuration);
        osc.stop(now + (i + 1) * noteDuration);
      }
    } catch (error) {
      console.warn('Error playing victory sound:', error);
    }
  }

  /**
   * Play a collapse sound effect
   */
  playCollapseSound() {
    if (!this.isInitialized || !this.audioContext) return;

    try {
      // Create a descending tone with noise
      const now = this.audioContext.currentTime;
      const duration = 1.5;

      // Descending tone
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + duration);

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);

      // Add noise burst
      if (this.noiseBuffer) {
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseSource.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + duration);
      }
    } catch (error) {
      console.warn('Error playing collapse sound:', error);
    }
  }

  /**
   * Resume audio context if suspended (required for user interaction)
   */
  resumeContext() {
    if (!this.isInitialized || !this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('Audio context resumed');
        });
      }
    } catch (error) {
      console.warn('Error resuming audio context:', error);
    }
  }

  /**
   * Dispose of audio resources
   */
  dispose() {
    try {
      // Stop all oscillators
      this.oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });

      if (this.lfoOscillator) {
        try {
          this.lfoOscillator.stop();
        } catch (e) {
          // Already stopped
        }
      }

      if (this.noiseSource) {
        try {
          this.noiseSource.stop();
        } catch (e) {
          // Already stopped
        }
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }

      this.isInitialized = false;
      console.log('Audio manager disposed');
    } catch (error) {
      console.warn('Error disposing audio:', error);
    }
  }
}

// Global audio manager instance
let audioManager = new AudioManager();
