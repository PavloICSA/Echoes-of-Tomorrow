/**
 * Test suite for performance optimization and throttling
 * Run with: node js/test-performance.js
 */

// Mock performance object for testing
const mockPerformance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 500 * 1024 * 1024
  }
};

// Mock frame time monitor
let frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67, // 60 FPS target (1000ms / 60)
  warningLogged: false
};

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
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for logging
 * @returns {*} Function result
 */
function measurePerformance(fn, label = 'Operation') {
  const startTime = mockPerformance.now();
  const result = fn();
  const endTime = mockPerformance.now();
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
  const memory = mockPerformance.memory ? {
    usedJSHeapSize: (mockPerformance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (mockPerformance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    jsHeapSizeLimit: (mockPerformance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  } : null;
  
  return {
    timestamp: mockPerformance.now(),
    memory: memory,
    isTabActive: true
  };
}

// Test 1: Frame time monitor initialization
console.log('Test 1: Frame time monitor initialization');
if (frameTimeMonitor.frameCount === 0 && frameTimeMonitor.totalFrameTime === 0) {
  console.log('  ✓ PASS: Frame time monitor initialized correctly');
} else {
  console.log('  ✗ FAIL: Frame time monitor not initialized');
}

// Test 2: Frame time tracking
console.log('\nTest 2: Frame time tracking');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
updateFrameTimeMonitor(10.5);
if (frameTimeMonitor.frameCount === 1 && frameTimeMonitor.totalFrameTime === 10.5) {
  console.log('  ✓ PASS: Frame time tracked correctly');
} else {
  console.log('  ✗ FAIL: Frame time not tracked');
}

// Test 3: Max frame time tracking
console.log('\nTest 3: Max frame time tracking');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
updateFrameTimeMonitor(10.0);
updateFrameTimeMonitor(20.0);
updateFrameTimeMonitor(15.0);
if (frameTimeMonitor.maxFrameTime === 20.0) {
  console.log('  ✓ PASS: Max frame time tracked correctly');
} else {
  console.log(`  ✗ FAIL: Max frame time is ${frameTimeMonitor.maxFrameTime} (expected 20.0)`);
}

// Test 4: Average frame time calculation
console.log('\nTest 4: Average frame time calculation');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
updateFrameTimeMonitor(10.0);
updateFrameTimeMonitor(15.0);
updateFrameTimeMonitor(20.0);
const avgFrameTime = frameTimeMonitor.totalFrameTime / frameTimeMonitor.frameCount;
if (Math.abs(avgFrameTime - 15.0) < 0.01) {
  console.log(`  ✓ PASS: Average frame time is ${avgFrameTime.toFixed(2)}ms`);
} else {
  console.log(`  ✗ FAIL: Average frame time is ${avgFrameTime.toFixed(2)}ms (expected 15.0)`);
}

// Test 5: Frame time warning threshold
console.log('\nTest 5: Frame time warning threshold');
if (frameTimeMonitor.warningThreshold === 16.67) {
  console.log(`  ✓ PASS: Warning threshold is ${frameTimeMonitor.warningThreshold}ms (60 FPS target)`);
} else {
  console.log(`  ✗ FAIL: Warning threshold is ${frameTimeMonitor.warningThreshold}ms`);
}

// Test 6: Frame time exceeding threshold detection
console.log('\nTest 6: Frame time exceeding threshold detection');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
updateFrameTimeMonitor(20.0); // Exceeds threshold
if (frameTimeMonitor.warningLogged === true) {
  console.log('  ✓ PASS: Frame time exceeding threshold detected');
} else {
  console.log('  ✗ FAIL: Frame time exceeding threshold not detected');
}

// Test 7: Multiple frame times with mixed performance
console.log('\nTest 7: Multiple frame times with mixed performance');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
const frameTimes = [12.0, 14.5, 16.0, 18.5, 15.0, 13.0, 17.0, 16.5];
frameTimes.forEach(ft => updateFrameTimeMonitor(ft));
const avgFt = frameTimeMonitor.totalFrameTime / frameTimeMonitor.frameCount;
const fps = 1000 / avgFt;
if (frameTimeMonitor.frameCount === 8 && fps > 50 && fps < 70) {
  console.log(`  ✓ PASS: Mixed performance tracked (${fps.toFixed(1)} FPS average)`);
} else {
  console.log(`  ✗ FAIL: Mixed performance not tracked correctly`);
}

// Test 8: Measure performance utility
console.log('\nTest 8: Measure performance utility');
let testResult = null;
measurePerformance(() => {
  testResult = 42;
}, 'Test operation');
if (testResult === 42) {
  console.log('  ✓ PASS: Measure performance utility works');
} else {
  console.log('  ✗ FAIL: Measure performance utility failed');
}

// Test 9: Get performance metrics
console.log('\nTest 9: Get performance metrics');
const metrics = getPerformanceMetrics();
if (metrics.timestamp && metrics.memory && metrics.isTabActive !== undefined) {
  console.log('  ✓ PASS: Performance metrics retrieved');
  console.log(`    - Memory: ${metrics.memory.usedJSHeapSize} / ${metrics.memory.totalJSHeapSize}`);
  console.log(`    - Tab active: ${metrics.isTabActive}`);
} else {
  console.log('  ✗ FAIL: Performance metrics incomplete');
}

// Test 10: Frame time consistency
console.log('\nTest 10: Frame time consistency');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
// Simulate 60 frames at 16.67ms each (perfect 60 FPS)
for (let i = 0; i < 60; i++) {
  updateFrameTimeMonitor(16.67);
}
const perfectAvg = frameTimeMonitor.totalFrameTime / frameTimeMonitor.frameCount;
const perfectFps = 1000 / perfectAvg;
if (Math.abs(perfectFps - 60) < 1) {
  console.log(`  ✓ PASS: Frame time consistency maintained (${perfectFps.toFixed(1)} FPS)`);
} else {
  console.log(`  ✗ FAIL: Frame time consistency issue (${perfectFps.toFixed(1)} FPS)`);
}

// Test 11: Throttling detection (tab inactive)
console.log('\nTest 11: Throttling detection (tab inactive)');
const isTabActive = typeof document !== 'undefined' ? !document.hidden : true;
if (typeof isTabActive === 'boolean') {
  console.log(`  ✓ PASS: Tab active state can be detected (currently: ${isTabActive})`);
} else {
  console.log('  ✗ FAIL: Tab active state detection failed');
}

// Test 12: Performance warning logging
console.log('\nTest 12: Performance warning logging');
frameTimeMonitor = {
  lastFrameTime: 0,
  frameCount: 0,
  totalFrameTime: 0,
  maxFrameTime: 0,
  warningThreshold: 16.67,
  warningLogged: false
};
updateFrameTimeMonitor(25.0); // Significantly exceeds threshold
if (frameTimeMonitor.warningLogged === true && frameTimeMonitor.maxFrameTime === 25.0) {
  console.log('  ✓ PASS: Performance warning logged for slow frame');
} else {
  console.log('  ✗ FAIL: Performance warning not logged');
}

console.log('\n✓ All performance optimization tests completed');
