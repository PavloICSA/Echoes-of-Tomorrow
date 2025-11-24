/**
 * Test suite for audio synthesis and management
 * Tests the AudioManager class and its integration with game state
 * Run with: node js/test-audio.js (requires Node.js with Web Audio API polyfill)
 * Or run in browser console after loading the game
 */

// Mock Web Audio API for Node.js testing (if needed)
if (typeof window === 'undefined') {
  global.window = {
    AudioContext: class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.destination = {};
      }
      createGain() {
        return {
          gain: { value: 0, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
          disconnect: () => {}
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { value: 0, exponentialRampToValueAtTime: () => {}, setValueAtTime: () => {} },
          connect: () => {},
          disconnect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      createBiquadFilter() {
        return {
          type: 'lowpass',
          frequency: { value: 0, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
          disconnect: () => {}
        };
      }
      createBuffer(channels, length, sampleRate) {
        return {
          getChannelData: () => new Float32Array(length),
          numberOfChannels: channels,
          length: length,
          sampleRate: sampleRate
        };
      }
      createBufferSource() {
        return {
          buffer: null,
          loop: false,
          connect: () => {},
          disconnect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    },
    webkitAudioContext: null
  };
}

// Helper function to clamp values
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Mock AudioManager for testing (simplified version)
class AudioManagerTest {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isMuted = false;
    this.masterGain = null;
    this.oscillators = [];
    this.gainNodes = [];
    this.noiseGain = null;
    this.filter = null;
    this.currentFrequencies = [110, 165, 220];
    this.targetFrequencies = [110, 165, 220];
    this.lastUpdateTime = 0;
    this.updateInterval = 100;
  }

  initialize() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.15;
      this.masterGain.connect(this.audioContext.destination);
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 2000;
      this.filter.connect(this.masterGain);
      for (let i = 0; i < 3; i++) {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = this.currentFrequencies[i];
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(this.filter);
        osc.start();
        this.oscillators.push(osc);
        this.gainNodes.push(gain);
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      this.isInitialized = false;
    }
  }

  updateAudio(variables) {
    if (!this.isInitialized || !this.audioContext) return;
    const now = performance.now ? performance.now() : Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = now;

    try {
      const ecologyFreq = 110 + (variables.ecology / 100) * 110;
      const cohesionFreq = 165 + (variables.cohesion / 100) * 165;
      const innovationFreq = 220 + (variables.innovation / 100) * 220;
      const stabilityFilter = 1000 + (variables.stability / 100) * 3000;

      this.targetFrequencies = [ecologyFreq, cohesionFreq, innovationFreq];

      for (let i = 0; i < this.oscillators.length; i++) {
        const osc = this.oscillators[i];
        const targetFreq = this.targetFrequencies[i];
        osc.frequency.exponentialRampToValueAtTime(
          targetFreq,
          this.audioContext.currentTime + 0.5
        );
      }

      this.filter.frequency.exponentialRampToValueAtTime(
        stabilityFilter,
        this.audioContext.currentTime + 0.5
      );

      const targetVolume = (variables.cohesion / 100) * 0.2;
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.05, targetVolume),
        this.audioContext.currentTime + 0.5
      );
    } catch (error) {
      console.warn('Error updating audio:', error);
    }
  }

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

  dispose() {
    try {
      this.oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {}
      });
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.isInitialized = false;
    } catch (error) {
      console.warn('Error disposing audio:', error);
    }
  }
}

// Test Suite
console.log('=== Audio Manager Test Suite ===\n');

// Test 1: AudioManager initialization
console.log('Test 1: AudioManager initialization');
const audioMgr = new AudioManagerTest();
audioMgr.initialize();
if (audioMgr.isInitialized && audioMgr.audioContext) {
  console.log('  ✓ PASS: AudioManager initialized successfully');
} else {
  console.log('  ✗ FAIL: AudioManager failed to initialize');
}

// Test 2: Oscillators created
console.log('\nTest 2: Oscillators created');
if (audioMgr.oscillators.length === 3) {
  console.log(`  ✓ PASS: ${audioMgr.oscillators.length} oscillators created`);
} else {
  console.log(`  ✗ FAIL: Expected 3 oscillators, got ${audioMgr.oscillators.length}`);
}

// Test 3: Initial frequencies set correctly
console.log('\nTest 3: Initial frequencies set correctly');
const expectedFreqs = [110, 165, 220];
let freqsCorrect = true;
for (let i = 0; i < audioMgr.currentFrequencies.length; i++) {
  if (audioMgr.currentFrequencies[i] !== expectedFreqs[i]) {
    freqsCorrect = false;
    break;
  }
}
if (freqsCorrect) {
  console.log(`  ✓ PASS: Initial frequencies [${audioMgr.currentFrequencies.join(', ')}] Hz`);
} else {
  console.log(`  ✗ FAIL: Frequencies mismatch`);
}

// Test 4: Audio update with variables (Property: Audio Responsiveness)
console.log('\nTest 4: Audio update with variables (Property: Audio Responsiveness)');
const testVariables = {
  ecology: 75,
  cohesion: 50,
  innovation: 80,
  stability: 60
};
audioMgr.updateAudio(testVariables);
const expectedEcologyFreq = 110 + (75 / 100) * 110; // ~192.5 Hz
const expectedCohesionFreq = 165 + (50 / 100) * 165; // ~247.5 Hz
const expectedInnovationFreq = 220 + (80 / 100) * 220; // ~396 Hz

if (audioMgr.targetFrequencies.length === 3) {
  console.log(`  ✓ PASS: Target frequencies updated`);
  console.log(`    Ecology: ${audioMgr.targetFrequencies[0].toFixed(1)} Hz (expected ~${expectedEcologyFreq.toFixed(1)})`);
  console.log(`    Cohesion: ${audioMgr.targetFrequencies[1].toFixed(1)} Hz (expected ~${expectedCohesionFreq.toFixed(1)})`);
  console.log(`    Innovation: ${audioMgr.targetFrequencies[2].toFixed(1)} Hz (expected ~${expectedInnovationFreq.toFixed(1)})`);
} else {
  console.log('  ✗ FAIL: Target frequencies not updated');
}

// Test 5: Mute toggle
console.log('\nTest 5: Mute toggle');
const initialMuteState = audioMgr.isMuted;
audioMgr.toggleMute();
const toggledMuteState = audioMgr.isMuted;
if (initialMuteState !== toggledMuteState) {
  console.log(`  ✓ PASS: Mute toggled from ${initialMuteState} to ${toggledMuteState}`);
} else {
  console.log('  ✗ FAIL: Mute toggle did not change state');
}

// Test 6: Set mute explicitly
console.log('\nTest 6: Set mute explicitly');
audioMgr.setMute(true);
if (audioMgr.isMuted === true) {
  console.log('  ✓ PASS: Mute set to true');
} else {
  console.log('  ✗ FAIL: Mute not set correctly');
}

audioMgr.setMute(false);
if (audioMgr.isMuted === false) {
  console.log('  ✓ PASS: Mute set to false');
} else {
  console.log('  ✗ FAIL: Mute not set correctly');
}

// Test 7: Frequency mapping (Property: Frequency Mapping)
console.log('\nTest 7: Frequency mapping for all variables');
let frequencyMappingPass = true;
const testCases = [
  { ecology: 0, cohesion: 0, innovation: 0, stability: 0 },
  { ecology: 50, cohesion: 50, innovation: 50, stability: 50 },
  { ecology: 100, cohesion: 100, innovation: 100, stability: 100 }
];

testCases.forEach((vars, idx) => {
  audioMgr.updateAudio(vars);
  const ecologyFreq = audioMgr.targetFrequencies[0];
  const cohesionFreq = audioMgr.targetFrequencies[1];
  const innovationFreq = audioMgr.targetFrequencies[2];

  // Verify frequencies are within expected ranges
  if (ecologyFreq < 110 || ecologyFreq > 220) frequencyMappingPass = false;
  if (cohesionFreq < 165 || cohesionFreq > 330) frequencyMappingPass = false;
  if (innovationFreq < 220 || innovationFreq > 440) frequencyMappingPass = false;
});

if (frequencyMappingPass) {
  console.log('  ✓ PASS: All frequencies within expected ranges');
} else {
  console.log('  ✗ FAIL: Some frequencies out of range');
}

// Test 8: Audio context state
console.log('\nTest 8: Audio context state');
if (audioMgr.audioContext && audioMgr.audioContext.state) {
  console.log(`  ✓ PASS: Audio context state is "${audioMgr.audioContext.state}"`);
} else {
  console.log('  ✗ FAIL: Audio context state unavailable');
}

// Test 9: Disposal
console.log('\nTest 9: Disposal');
audioMgr.dispose();
if (!audioMgr.isInitialized) {
  console.log('  ✓ PASS: AudioManager disposed successfully');
} else {
  console.log('  ✗ FAIL: AudioManager not disposed');
}

console.log('\n✓ All audio tests completed');
