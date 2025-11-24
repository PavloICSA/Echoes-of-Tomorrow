# Echoes of Tomorrow

A web-based strategy game where you assume the role of the Future, sending Echo Cards back in time to influence civilization's trajectory.

## Overview

Guide four civilization variables - **Ecology**, **Cohesion**, **Innovation**, and **Stability** - toward victory or away from collapse. Each turn, you select one of three Echo Cards to apply effects to these variables. Reach victory by maintaining all variables ≥80 for five consecutive turns, or face collapse if any variable drops to ≤5.

The entire experience is powered by procedurally-generated visuals that evolve in real-time based on civilization state, with no external assets required.

## How to Run

### Option 1: Open Directly
Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge).

### Option 2: Local HTTP Server
Run a local server to avoid CORS issues:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

### Option 3: Try it Online
Simply follow the [link](https://echoes-of-tomorrow.netlify.app/).

### Requirements
- Modern browser with WebGL support
- No build tools or dependencies required (Three.js is loaded via CDN)

## Controls and Rules

### Keyboard Controls
- **1, 2, 3**: Select the corresponding Echo Card
- **R**: Restart the game
- **S**: Export a screenshot of the Time Mirror visualization
- **M**: Toggle audio mute

### Mouse Controls
- **Click a card**: Select and play that card

### Game Rules

**Victory Condition**: All four variables ≥80 for five consecutive turns
- When achieved, the visualization morphs into balanced green-blue symmetry
- A victory screen appears with a restart prompt

**Collapse Condition**: Any variable drops to ≤5
- The game immediately ends
- The visualization transitions to red static and glitch effects
- A game-over screen appears with a restart prompt

**Variable Ranges**: All variables are clamped to [0, 100]
- Starting values: 50 for each variable
- Card effects are applied with variance (±random amount) for unpredictability
- Interpolation smoothly animates variable changes over 500–1200ms

**Turn Advancement**: Each turn, three new unique Echo Cards are drawn
- No duplicates within a single turn's selection
- Turn counter increments after each card play

## UI Layout

- **Left Panel (30%)**: Echo Card display with title, description, and effects
- **Right Panel (70%)**: Time Mirror visualization (procedural graphics)
- **Bottom Bar**: Four metric widgets showing current variable values and progress bars
- **Top Bar**: Turn counter, Restart button, Screenshot button, Quality toggle, Mute button
- **System Messages**: Brief feedback text describing card effects

## Quality Mode

Adjust visual complexity and performance via the Quality toggle in the top-right corner:

- **Low**: Reduced shader iterations and particle counts; best for weak devices
- **Medium**: Balanced quality and performance (default)
- **High**: Maximum visual complexity; requires strong GPU

## Variable-to-Shader Mappings

The Time Mirror visualization is driven by the four civilization variables, each mapped to specific visual layers:

### Ecology (Green Waveforms)
- **Low values**: Sparse, chaotic waveforms
- **High values**: Dense, coherent green patterns
- **Shader layer**: Sine wave modulation with organic noise

### Cohesion (Network Nodes)
- **Low values**: Disconnected, dim nodes
- **High values**: Bright, densely connected network
- **Shader layer**: Node graph with connecting lines and glow

### Innovation (Blue Fractals)
- **Low values**: Smooth, low-frequency patterns
- **High values**: Complex, high-frequency fractal turbulence
- **Shader layer**: Mandelbrot-like fractal with edge detection

### Stability (Red Noise Suppression)
- **Low values**: Red noise spikes and visual glitches
- **High values**: Stable, clean patterns with minimal red artifacts
- **Shader layer**: Red noise overlay (inverse relationship)

### Victory Animation
When all variables reach ≥80 for five consecutive turns, the shader morphs toward balanced green-blue symmetry with calming, harmonious patterns over 2–3 seconds.

### Collapse Animation
When any variable drops to ≤5, the shader transitions to red static and WebGL glitch effects over 1–2 seconds.

## Echo Card Pool

The game includes 30+ distinct Echo Cards with varied effects:

- **Positive cards**: Increase one or more variables
- **Negative cards**: Decrease variables (risk/reward scenarios)
- **Mixed-effect cards**: Tradeoffs (e.g., increase Ecology but decrease Innovation)

Each card has:
- **Title**: Short name (≤8 words)
- **Description**: Effect summary (≤12 words)
- **Effects**: Numeric changes to each variable
- **Variance**: Random ±amount applied to effects for unpredictability

## Development Notes

### Project Structure
```
echoes-of-tomorrow-web/
├── index.html              # Entry point
├── styles.css              # Responsive layout and styling
├── js/
│   ├── app.js              # Bootstrap and game loop
│   ├── ui.js               # UI components and rendering
│   ├── sim.js              # Game simulation and state
│   ├── visuals.js          # Three.js scene and rendering
│   ├── utils.js            # Helper functions
│   ├── audio.js            # Optional procedural audio
│   └── cards.json          # Card pool (30+ cards)
├── shaders/
│   └── fragment.glsl       # Procedural visualization shader
├── README.md               # This file
├── LICENSE                 # MIT license
```

### Key Technologies
- **Vanilla JavaScript (ES6+)**: No frameworks
- **Three.js**: 3D scene management and WebGL abstraction
- **GLSL Fragment Shaders**: GPU-accelerated procedural visuals
- **WebAudio API**: Optional procedural audio synthesis

### Game State Management
The game state is managed in `sim.js` and includes:
- Current variable values (0–100)
- Turn counter
- Victory counter (increments when all vars ≥80)
- Game status (playing, victory, or collapse)
- Quality mode (low, medium, high)
- Audio mute state

### Rendering Pipeline
1. **sim.js**: Update game state and variables
2. **ui.js**: Render card panel, metric bar, and system messages
3. **visuals.js**: Update shader uniforms and render Three.js scene
4. **fragment.glsl**: Compose procedural layers and output final color

### Performance Optimization
- Quality mode adjusts shader complexity (iterations: low=2, medium=4, high=8)
- Rendering throttles when browser tab is inactive
- Frame time monitoring logs warnings if >16.67ms (60 FPS target)
- Particle pooling in shader reuses calculations

### Accessibility
- Keyboard controls (1/2/3, R, S, M) for full gameplay without mouse
- Semantic HTML for screen reader compatibility
- WCAG AA color contrast standards
- Responsive layout works on desktop and mobile

## Testing

Property-based tests validate correctness properties:
- Variable clamping (always [0, 100])
- Card uniqueness (no duplicates per turn)
- Victory and collapse triggers
- Turn advancement
- Card effect variance
- Restart state reset
- Visualization responsiveness
- Interpolation duration
- Screenshot validity

Run tests with:
```bash
npm test  # or equivalent for your test runner
```

## License

MIT License — see LICENSE file for details.

## Credits

Built with vanilla JavaScript, Three.js, and GLSL shaders. No external assets required.

---

**Play Echoes of Tomorrow and shape the future!**

