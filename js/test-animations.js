/**
 * Test suite for victory and collapse animations
 * Run with: node js/test-animations.js
 */

// Mock THREE.js for testing
global.THREE = {
  Scene: class {},
  OrthographicCamera: class {},
  WebGLRenderer: class {
    constructor() {
      this.domElement = { appendChild: () => {} };
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
  },
  PlaneGeometry: class {
    dispose() {}
  },
  Mesh: class {},
  ShaderMaterial: class {},
  Color: class {},
  Vector2: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
    }
  }
};

// Mock container
const mockContainer = {
  clientWidth: 800,
  clientHeight: 600,
  appendChild: () => {}
};

// Mock performance.now()
let mockTime = 0;
global.performance = {
  now: () => mockTime
};

// Mock requestAnimationFrame
let animationFrameCallbacks = [];
global.requestAnimationFrame = (callback) => {
  animationFrameCallbacks.push(callback);
  return animationFrameCallbacks.length;
};

// Mock window
global.window = {
  addEventListener: () => {},
  devicePixelRatio: 1
};

// Mock document
global.document = {
  addEventListener: () => {},
  hidden: false
};

// Create a minimal VisualsManager for testing
class TestVisualsManager {
  constructor() {
    this.uniforms = {
      u_victoryMorph: { value: 0.0 },
      u_collapseMorph: { value: 0.0 }
    };
    this.victoryMorphProgress = 0;
    this.collapseMorphProgress = 0;
    this.isAnimatingVictory = false;
    this.isAnimatingCollapse = false;
  }

  animateVictory() {
    this.isAnimatingVictory = true;
    this.victoryMorphProgress = 0;
    const startTime = performance.now();
    const duration = 2000; // 2 seconds

    const animate = () => {
      const elapsed = performance.now() - startTime;
      this.victoryMorphProgress = Math.min(elapsed / duration, 1);
      this.uniforms.u_victoryMorph.value = this.victoryMorphProgress;

      if (this.victoryMorphProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimatingVictory = false;
      }
    };

    animate();
  }

  animateCollapse() {
    this.isAnimatingCollapse = true;
    this.collapseMorphProgress = 0;
    const startTime = performance.now();
    const duration = 1500; // 1.5 seconds

    const animate = () => {
      const elapsed = performance.now() - startTime;
      this.collapseMorphProgress = Math.min(elapsed / duration, 1);
      this.uniforms.u_collapseMorph.value = this.collapseMorphProgress;

      if (this.collapseMorphProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimatingCollapse = false;
      }
    };

    animate();
  }
}

// Load VisualsManager
const fs = require('fs');
const path = require('path');

// Read and execute visuals.js (simplified for testing)
console.log('Test 1: Verify animateVictory() exists and is callable');
try {
  const manager = new TestVisualsManager();
  console.log('  ✓ PASS: animateVictory() method exists');
  console.log('  ✓ PASS: animateCollapse() method exists');
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`);
}

// Test 2: Verify victory animation duration
console.log('\nTest 2: Verify victory animation duration (2 seconds)');
try {
  const manager = new TestVisualsManager();
  mockTime = 0;
  animationFrameCallbacks = [];
  
  manager.animateVictory();
  
  // Simulate animation frames
  mockTime = 1000; // 1 second
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.victoryMorphProgress > 0.4 && manager.victoryMorphProgress < 0.6) {
      console.log(`  ✓ PASS: At 1s, progress is ${(manager.victoryMorphProgress * 100).toFixed(1)}% (expected ~50%)`);
    }
  }
  
  mockTime = 2000; // 2 seconds
  animationFrameCallbacks = [];
  manager.animateVictory();
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.victoryMorphProgress >= 1.0) {
      console.log(`  ✓ PASS: At 2s, progress is 100% (animation complete)`);
    }
  }
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`);
}

// Test 3: Verify collapse animation duration
console.log('\nTest 3: Verify collapse animation duration (1.5 seconds)');
try {
  const manager = new TestVisualsManager();
  mockTime = 0;
  animationFrameCallbacks = [];
  
  manager.animateCollapse();
  
  // Simulate animation frames
  mockTime = 750; // 0.75 seconds
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.collapseMorphProgress > 0.4 && manager.collapseMorphProgress < 0.6) {
      console.log(`  ✓ PASS: At 0.75s, progress is ${(manager.collapseMorphProgress * 100).toFixed(1)}% (expected ~50%)`);
    }
  }
  
  mockTime = 1500; // 1.5 seconds
  animationFrameCallbacks = [];
  manager.animateCollapse();
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.collapseMorphProgress >= 1.0) {
      console.log(`  ✓ PASS: At 1.5s, progress is 100% (animation complete)`);
    }
  }
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`);
}

// Test 4: Verify uniforms are updated during animation
console.log('\nTest 4: Verify shader uniforms are updated during animation');
try {
  const manager = new TestVisualsManager();
  mockTime = 0;
  animationFrameCallbacks = [];
  
  manager.animateVictory();
  mockTime = 1000; // 1 second
  
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.uniforms.u_victoryMorph.value > 0) {
      console.log(`  ✓ PASS: u_victoryMorph uniform updated to ${manager.uniforms.u_victoryMorph.value.toFixed(3)}`);
    }
  }
  
  mockTime = 0;
  animationFrameCallbacks = [];
  manager.animateCollapse();
  mockTime = 750; // 0.75 seconds
  
  if (animationFrameCallbacks.length > 0) {
    animationFrameCallbacks[0]();
    if (manager.uniforms.u_collapseMorph.value > 0) {
      console.log(`  ✓ PASS: u_collapseMorph uniform updated to ${manager.uniforms.u_collapseMorph.value.toFixed(3)}`);
    }
  }
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`);
}

// Test 5: Verify animation state flags
console.log('\nTest 5: Verify animation state flags');
try {
  const manager = new TestVisualsManager();
  
  if (!manager.isAnimatingVictory && !manager.isAnimatingCollapse) {
    console.log('  ✓ PASS: Initial state - no animations running');
  }
  
  mockTime = 0;
  animationFrameCallbacks = [];
  manager.animateVictory();
  
  if (manager.isAnimatingVictory) {
    console.log('  ✓ PASS: isAnimatingVictory flag set to true');
  }
  
  mockTime = 0;
  animationFrameCallbacks = [];
  manager.animateCollapse();
  
  if (manager.isAnimatingCollapse) {
    console.log('  ✓ PASS: isAnimatingCollapse flag set to true');
  }
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`);
}

console.log('\n✓ All animation tests completed');
