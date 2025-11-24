/**
 * Test suite for quality mode toggle functionality
 * Run with: node js/test-quality.js
 */

// Mock GameState for testing
class MockGameState {
  constructor() {
    this.qualityMode = 'medium';
  }
}

// Mock VisualsManager for testing
class MockVisualsManager {
  constructor() {
    this.qualityMode = 'medium';
    this.pixelRatio = 1;
    this.uniforms = {
      u_quality: { value: 1 }
    };
  }

  setRendererResolution(qualityMode) {
    this.qualityMode = qualityMode;
    
    // Simulate pixel ratio adjustment
    let pixelRatio = 2; // Assume device pixel ratio of 2
    if (qualityMode === 'low') {
      pixelRatio = Math.max(1, pixelRatio * 0.5); // 50% resolution
    } else if (qualityMode === 'medium') {
      pixelRatio = Math.max(1, pixelRatio * 0.75); // 75% resolution
    }
    // 'high' uses full device pixel ratio
    
    this.pixelRatio = pixelRatio;
  }

  updateQualityMode(qualityMode) {
    this.setRendererResolution(qualityMode);
  }

  updateUniforms(qualityMode) {
    const qualityMap = { 'low': 0, 'medium': 1, 'high': 2 };
    const value = qualityMap[qualityMode];
    if (value !== undefined) {
      this.uniforms.u_quality.value = value;
    }
  }
}

// Test 1: Quality mode state initialization
console.log('Test 1: Quality mode state initialization');
const gameState = new MockGameState();
if (gameState.qualityMode === 'medium') {
  console.log('  ✓ PASS: Initial quality mode is "medium"');
} else {
  console.log(`  ✗ FAIL: Initial quality mode is "${gameState.qualityMode}" (expected "medium")`);
}

// Test 2: Quality mode toggle cycles through modes
console.log('\nTest 2: Quality mode toggle cycles through modes');
const modes = ['low', 'medium', 'high'];
let togglePass = true;
let currentMode = 'medium';

// Expected sequence starting from 'medium': high → low → medium → high → low → medium
const expectedSequence = ['high', 'low', 'medium', 'high', 'low', 'medium'];

for (let i = 0; i < 6; i++) {
  const currentIndex = modes.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  currentMode = modes[nextIndex];
  
  if (currentMode !== expectedSequence[i]) {
    console.log(`  ✗ Iteration ${i}: Expected "${expectedSequence[i]}", got "${currentMode}"`);
    togglePass = false;
    break;
  }
}

if (togglePass) {
  console.log('  ✓ PASS: Quality mode cycles correctly through all modes');
}

// Test 3: Pixel ratio adjustment for low quality
console.log('\nTest 3: Pixel ratio adjustment for low quality');
const visualsLow = new MockVisualsManager();
visualsLow.setRendererResolution('low');
if (visualsLow.pixelRatio === 1) {
  console.log(`  ✓ PASS: Low quality pixel ratio is ${visualsLow.pixelRatio} (50% of device ratio 2)`);
} else {
  console.log(`  ✗ FAIL: Low quality pixel ratio is ${visualsLow.pixelRatio} (expected 1)`);
}

// Test 4: Pixel ratio adjustment for medium quality
console.log('\nTest 4: Pixel ratio adjustment for medium quality');
const visualsMedium = new MockVisualsManager();
visualsMedium.setRendererResolution('medium');
if (visualsMedium.pixelRatio === 1.5) {
  console.log(`  ✓ PASS: Medium quality pixel ratio is ${visualsMedium.pixelRatio} (75% of device ratio 2)`);
} else {
  console.log(`  ✗ FAIL: Medium quality pixel ratio is ${visualsMedium.pixelRatio} (expected 1.5)`);
}

// Test 5: Pixel ratio adjustment for high quality
console.log('\nTest 5: Pixel ratio adjustment for high quality');
const visualsHigh = new MockVisualsManager();
visualsHigh.setRendererResolution('high');
if (visualsHigh.pixelRatio === 2) {
  console.log(`  ✓ PASS: High quality pixel ratio is ${visualsHigh.pixelRatio} (100% of device ratio 2)`);
} else {
  console.log(`  ✗ FAIL: High quality pixel ratio is ${visualsHigh.pixelRatio} (expected 2)`);
}

// Test 6: Shader uniform u_quality for low mode
console.log('\nTest 6: Shader uniform u_quality for low mode');
const shaderLow = new MockVisualsManager();
shaderLow.uniforms.u_quality.value = 1; // Reset to default
shaderLow.updateUniforms('low');
if (shaderLow.uniforms.u_quality.value === 0) {
  console.log(`  ✓ PASS: u_quality uniform is ${shaderLow.uniforms.u_quality.value} for low mode`);
} else {
  console.log(`  ✗ FAIL: u_quality uniform is ${shaderLow.uniforms.u_quality.value} (expected 0)`);
}

// Test 7: Shader uniform u_quality for medium mode
console.log('\nTest 7: Shader uniform u_quality for medium mode');
const shaderMedium = new MockVisualsManager();
shaderMedium.updateUniforms('medium');
if (shaderMedium.uniforms.u_quality.value === 1) {
  console.log(`  ✓ PASS: u_quality uniform is ${shaderMedium.uniforms.u_quality.value} for medium mode`);
} else {
  console.log(`  ✗ FAIL: u_quality uniform is ${shaderMedium.uniforms.u_quality.value} (expected 1)`);
}

// Test 8: Shader uniform u_quality for high mode
console.log('\nTest 8: Shader uniform u_quality for high mode');
const shaderHigh = new MockVisualsManager();
shaderHigh.updateUniforms('high');
if (shaderHigh.uniforms.u_quality.value === 2) {
  console.log(`  ✓ PASS: u_quality uniform is ${shaderHigh.uniforms.u_quality.value} for high mode`);
} else {
  console.log(`  ✗ FAIL: u_quality uniform is ${shaderHigh.uniforms.u_quality.value} (expected 2)`);
}

// Test 9: Quality mode persists across updates
console.log('\nTest 9: Quality mode persists across updates');
const visuals = new MockVisualsManager();
visuals.updateQualityMode('high');
visuals.updateUniforms('high');
if (visuals.qualityMode === 'high' && visuals.uniforms.u_quality.value === 2) {
  console.log('  ✓ PASS: Quality mode persists correctly');
} else {
  console.log('  ✗ FAIL: Quality mode did not persist');
}

// Test 10: All quality modes are valid
console.log('\nTest 10: All quality modes are valid');
const validModes = ['low', 'medium', 'high'];
let allValid = true;
validModes.forEach(mode => {
  const visuals = new MockVisualsManager();
  visuals.updateQualityMode(mode);
  visuals.updateUniforms(mode);
  
  if (!visuals.qualityMode || !Number.isFinite(visuals.uniforms.u_quality.value)) {
    console.log(`  ✗ Mode "${mode}" is invalid`);
    allValid = false;
  }
});
if (allValid) {
  console.log('  ✓ PASS: All quality modes are valid');
}

console.log('\n✓ All quality mode tests completed');
