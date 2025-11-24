/**
 * Three.js scene and visualization rendering
 */

class VisualsManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.shaderMaterial = null;
    this.mesh = null;
    this.uniforms = null;
    this.startTime = performance.now();
    this.victoryMorphProgress = 0;
    this.collapseMorphProgress = 0;
    this.isAnimatingVictory = false;
    this.isAnimatingCollapse = false;

    this.initScene();
  }

  /**
   * Initialize Three.js scene, camera, and renderer
   */
  initScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera setup
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );
    this.camera.position.z = 1;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.setRendererResolution(width, height);
    this.container.appendChild(this.renderer.domElement);

    // Create shader material
    this.createShaderMaterial();

    // Create mesh
    const geometry = new THREE.PlaneGeometry(width, height);
    this.mesh = new THREE.Mesh(geometry, this.shaderMaterial);
    this.scene.add(this.mesh);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Handle visibility change for throttling
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  /**
   * Set renderer resolution based on quality mode
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setRendererResolution(width, height) {
    const qualityMode = gameState.qualityMode || 'medium';
    let pixelRatio = window.devicePixelRatio;

    // Adjust pixel ratio based on quality mode
    if (qualityMode === 'low') {
      pixelRatio = Math.max(1, pixelRatio * 0.5); // 50% resolution
    } else if (qualityMode === 'medium') {
      pixelRatio = Math.max(1, pixelRatio * 0.75); // 75% resolution
    }
    // 'high' uses full device pixel ratio

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
  }

  /**
   * Create shader material with fragment shader
   */
  createShaderMaterial() {
    this.uniforms = {
      u_ecology: { value: 0.5 },
      u_cohesion: { value: 0.5 },
      u_innovation: { value: 0.5 },
      u_stability: { value: 0.5 },
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight) },
      u_victoryMorph: { value: 0.0 },
      u_collapseMorph: { value: 0.0 },
      u_quality: { value: 1 } // 0=low (2 iterations), 1=medium (4 iterations), 2=high (8 iterations)
    };

    const vertexShader = `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = this.getFragmentShader();

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
  }

  /**
   * Get fragment shader code (loaded from external file)
   * @returns {string} Fragment shader code
   */
  getFragmentShader() {
    // Fallback shader in case external file fails to load
    return `
      uniform float u_ecology;
      uniform float u_cohesion;
      uniform float u_innovation;
      uniform float u_stability;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_victoryMorph;
      uniform float u_collapseMorph;
      uniform float u_quality;

      // Pseudo-random function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      // Perlin-like noise
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        float ab = mix(a, b, f.x);
        float cd = mix(c, d, f.x);
        return mix(ab, cd, f.y);
      }

      // Fractional Brownian Motion with quality-based iterations
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        // Quality mode: 0=low (2 iter), 1=medium (4 iter), 2=high (8 iter)
        int maxIterations = 4;
        if (u_quality < 0.5) {
          maxIterations = 2;
        } else if (u_quality > 1.5) {
          maxIterations = 8;
        }
        
        for (int i = 0; i < 8; i++) {
          if (i >= maxIterations) break;
          value += amplitude * noise(st * frequency);
          st *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        
        // Base noise layer
        float baseNoise = fbm(uv * 3.0 + u_time * 0.05);
        
        // Waveform layer (ecology)
        float waves = sin(uv.y * 10.0 + u_time * 0.5) * u_ecology;
        
        // Node graph layer (cohesion)
        float nodes = fbm(uv * 5.0 + u_time * 0.1) * u_cohesion;
        
        // Fractal layer (innovation)
        float fractal = fbm(uv * 8.0 + u_time * 0.2) * u_innovation;
        
        // Instability layer (inverse stability)
        float instability = fbm(uv * 12.0 + u_time * 0.3) * (1.0 - u_stability);
        
        // Color composition
        vec3 greenWaves = mix(vec3(0.0, 0.3, 0.0), vec3(0.0, 1.0, 0.0), waves);
        vec3 blueNoise = mix(vec3(0.0, 0.2, 0.5), vec3(0.0, 1.0, 1.0), nodes + fractal);
        vec3 redStatic = mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.0, 0.0), instability);
        
        // Blend layers
        vec3 color = mix(greenWaves, blueNoise, u_innovation * 0.5);
        color = mix(color, redStatic, instability * 0.3);
        
        // Add base noise
        color += baseNoise * 0.1;
        
        // Victory morphing (green-blue symmetry)
        vec3 victoryColor = mix(vec3(0.0, 1.0, 0.5), vec3(0.0, 0.5, 1.0), sin(u_time * 0.5) * 0.5 + 0.5);
        color = mix(color, victoryColor, u_victoryMorph);
        
        // Collapse morphing (red static glitch)
        vec3 collapseColor = vec3(1.0, 0.0, 0.0) * (0.5 + 0.5 * sin(u_time * 10.0));
        color = mix(color, collapseColor, u_collapseMorph);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  /**
   * Update shader uniforms with current game state
   * @param {Object} variables - Game variables
   */
  updateUniforms(variables) {
    if (!this.uniforms) return;

    this.uniforms.u_ecology.value = normalize(variables.ecology);
    this.uniforms.u_cohesion.value = normalize(variables.cohesion);
    this.uniforms.u_innovation.value = normalize(variables.innovation);
    this.uniforms.u_stability.value = normalize(variables.stability);
    this.uniforms.u_time.value = (performance.now() - this.startTime) / 1000;

    // Update quality mode uniform
    const qualityMode = gameState.qualityMode || 'medium';
    const qualityMap = { 'low': 0, 'medium': 1, 'high': 2 };
    this.uniforms.u_quality.value = qualityMap[qualityMode] || 1;
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Animate victory state
   */
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

  /**
   * Animate collapse state
   */
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

  /**
   * Export canvas to PNG
   */
  exportCanvas() {
    const canvas = this.renderer.domElement;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `echoes-of-tomorrow-${Date.now()}.png`;
    link.click();
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.setRendererResolution(width, height);
    this.uniforms.u_resolution.value.set(width, height);

    // Update mesh geometry
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(width, height);
  }

  /**
   * Handle visibility change for throttling
   */
  onVisibilityChange() {
    if (document.hidden) {
      // Tab is inactive - throttle rendering
      console.log('Tab inactive: rendering throttled');
    } else {
      // Tab is active - resume normal rendering
      console.log('Tab active: rendering resumed');
    }
  }

  /**
   * Update quality mode and adjust rendering accordingly
   * @param {string} qualityMode - Quality mode ('low', 'medium', 'high')
   */
  updateQualityMode(qualityMode) {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.setRendererResolution(width, height);
  }
}

// Global visuals manager instance
let visualsManager = null;
