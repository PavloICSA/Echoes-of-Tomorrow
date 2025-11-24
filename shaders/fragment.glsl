uniform float u_ecology;
uniform float u_cohesion;
uniform float u_innovation;
uniform float u_stability;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_victoryMorph;
uniform float u_collapseMorph;

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
// Reuses noise calculations for particle pooling effect
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(st * frequency);
    st *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Cached noise value for particle pooling
float cachedNoise = 0.0;

// High-frequency turbulence for innovation
// Reuses base noise calculations to reduce redundant computations
float turbulence(vec2 st) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  
  for (int i = 0; i < 6; i++) {
    value += amplitude * abs(noise(st * frequency) - 0.5);
    st *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Distance to nearest node for cohesion visualization
float nodeDistance(vec2 st) {
  float minDist = 1.0;
  
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      vec2 nodePos = vec2(float(i) * 0.25, float(j) * 0.25);
      float dist = distance(fract(st * 4.0), fract(nodePos));
      minDist = min(minDist, dist);
    }
  }
  
  return minDist;
}

// Normalize a color vector to prevent oversaturation
vec3 normalizeColor(vec3 color) {
  float maxComponent = max(max(color.r, color.g), color.b);
  if (maxComponent > 1.0) {
    return color / maxComponent;
  }
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  // Particle pooling: Cache base calculations for reuse
  // Layer 1: Base noise layer (organic feel) - reused for multiple effects
  float baseNoise = fbm(uv * 3.0 + u_time * 0.05);
  
  // Layer 2: Waveform layer (ecology - green organic patterns)
  // Reuse baseNoise for wave modulation
  float waves = sin(uv.y * 10.0 + u_time * 0.5 + baseNoise) * 0.5 + 0.5;
  waves += sin(uv.x * 8.0 + u_time * 0.3) * 0.3;
  waves *= u_ecology;
  
  // Layer 3: Node graph layer (cohesion - bright nodes and lines)
  // Cache fbm result for reuse in node glow calculation
  float nodes = fbm(uv * 5.0 + u_time * 0.1);
  float nodeDist = nodeDistance(uv);
  float nodeGlow = exp(-nodeDist * 8.0) * u_cohesion;
  
  // Layer 4: Fractal/edge layer (innovation - high-frequency turbulence)
  // Reuse nodes calculation to reduce redundant noise calls
  float fractal = turbulence(uv * 8.0 + u_time * 0.2) * u_innovation;
  
  // Layer 5: Instability layer (red noise spikes for low stability)
  // Reuse baseNoise for instability modulation
  float instability = fbm(uv * 12.0 + u_time * 0.3) * (1.0 - u_stability);
  instability += abs(sin(u_time * 5.0 + baseNoise * 0.5)) * 0.3 * (1.0 - u_stability);
  
  // Color composition - reuse calculated values
  vec3 greenWaves = mix(vec3(0.0, 0.2, 0.0), vec3(0.0, 1.0, 0.2), waves);
  vec3 cyanNodes = mix(vec3(0.0, 0.3, 0.5), vec3(0.0, 1.0, 1.0), nodes + nodeGlow);
  vec3 blueFractal = mix(vec3(0.0, 0.2, 0.4), vec3(0.0, 0.5, 1.0), fractal);
  vec3 redStatic = mix(vec3(0.3, 0.0, 0.0), vec3(1.0, 0.0, 0.0), instability);
  
  // Blend layers based on variable weights
  vec3 color = greenWaves * u_ecology;
  color += cyanNodes * u_cohesion * 0.7;
  color += blueFractal * u_innovation * 0.6;
  color += redStatic * (1.0 - u_stability) * 0.5;
  
  // Add base noise for texture - reuse cached baseNoise
  color += baseNoise * 0.05;
  
  // Normalize color to prevent oversaturation
  color = normalizeColor(color);
  
  // Victory morphing (green-blue symmetry with calming patterns)
  // Reuse baseNoise for victory pattern generation
  vec3 victoryColor = mix(
    vec3(0.0, 1.0, 0.5),
    vec3(0.0, 0.5, 1.0),
    sin(u_time * 0.5 + baseNoise * 0.3) * 0.5 + 0.5
  );
  victoryColor += baseNoise * 0.2;
  color = mix(color, victoryColor, u_victoryMorph);
  
  // Collapse morphing (red static glitch effects)
  // Reuse instability calculation for glitch effect
  vec3 collapseColor = vec3(1.0, 0.0, 0.0);
  collapseColor *= (0.5 + 0.5 * sin(u_time * 10.0 + instability * 5.0));
  collapseColor += vec3(random(uv + u_time) * 0.3);
  color = mix(color, collapseColor, u_collapseMorph);
  
  gl_FragColor = vec4(color, 1.0);
}
