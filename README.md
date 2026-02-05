# Carve Drifters - Development Guide

## Project Structure

A dual-foot snowboarding game with POV perspective and 3D depth effects. Built with modular architecture using Phaser 3 and ES6 modules.

```
CarveDrifters/
├── index.html          (Main entry point)
├── demo.html           (Original prototype - preserved)
├── design_docs/
│   └── Main_idea.txt
└── src/
    ├── main.js         (Entry point, Phaser config)
    ├── config/
    │   └── constants.js    (All game constants)
    ├── entities/
    │   ├── Player.js       (Snowboarder with dual-foot control)
    │   └── Tree.js         (Obstacles with 3D depth)
    ├── managers/
    │   └── InputManager.js (Joystick-style input)
    └── scenes/
        ├── GameScene.js    (Main game loop)
        └── UIScene.js      (HUD overlay)
```

## Core Mechanics

### 1. Dual-Foot Control System

**Joystick-Style Input**:
- **WASD**: Control left foot
- **Arrow Keys**: Control right foot
- Feet snap back to center automatically (spring physics)
- Damped, fluid movement prevents jerky controls
- Dead zone prevents drift when keys are released

**Board Physics**:
- Board angle calculated from feet positions
- Fixed 120px length for consistent gameplay
- Alignment with slope affects speed:
  - Straight down = accelerate (gravity)
  - Perpendicular = brake (friction)
  - Diagonal = carve (style bonus)

### 2. POV Perspective with 3D Depth

**Camera Setup**:
- Player fixed at bottom of screen (y = 700)
- Mountain rushes toward you
- Creates first-person POV experience in 2D

**3D Depth Effect**:
- Trees start tiny (depth = 0.1) at top of screen
- Grow exponentially as they approach
- Scale from 0.2x to 1.5x based on depth
- Parallax effect: far trees shift less than near trees
- Approach speed accelerates exponentially (creates speed sensation)

### 3. Carving & Scoring

**Carving System**:
- Sideways angle = carving/braking
- Visual feedback: board turns orange when carving
- Snow spray particles emit from back edge
- Carving gives 2x score multiplier

**Score**:
- Distance traveled
- Trees dodged (10 points each)
- Carving bonus (2x multiplier)

### 4. Game Over Conditions

- Hit a tree (collision detection)
- Lose momentum (stopped for 60 frames)

## Running the Game

### Local Development

1. **Start a local server** (required for ES6 modules):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with http-server)
   npx http-server -p 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000/
   ```

### Controls

- **WASD**: Move left foot (up/down/left/right relative to body)
- **Arrow Keys**: Move right foot (up/down/left/right relative to body)
- **Space**: Restart game (when game over)

**Tips**:
- Keep feet mostly straight to accelerate
- Shift feet sideways to carve and control speed
- Carving gives bonus points but slows you down
- Don't hit trees or come to a complete stop!

## Technical Implementation

### Input System (InputManager)

**Spring Physics**:
```javascript
// Feet pulled toward input target
velocity += (target - position) * springStrength

// Also pulled toward center (auto-centering)
velocity += (-position) * (springStrength * 0.5)

// Damping for smooth motion
velocity *= damping
```

**Features**:
- Dead zone prevents accidental drift
- Maximum leg extension prevents unrealistic movement
- Minimum feet distance enforces physical constraints
- Smooth interpolation creates fluid feel

### Player Entity

**Board Rendering**:
- Fixed-length board drawn as thick line
- Angle calculated from foot positions using atan2
- Separate rendering for:
  - Board shadow (depth)
  - Board body (gradient color)
  - Board highlights (shine)
  - Bindings (where feet attach)
  - Feet (blue left, red right)

**Physics**:
- Velocity based on board alignment with slope
- Friction varies with angle (parallel vs perpendicular)
- Trail system for snow tracks
- Carving detection for bonus scoring

### Tree Entity (3D Depth)

**Depth System**:
```javascript
// Depth increases exponentially (acceleration effect)
depth += speed * 0.01 * Math.pow(depth + 0.1, 1.8)

// Scale based on depth
scale = 0.2 + (1.5 - 0.2) * min(depth, 1)

// Y position based on depth
y = lerp(100, 700, depth)
```

**Visual Variety**:
- Two tree types: pine (triangular) and rounded (circular)
- 4 different green shades
- Shadows appear when depth > 0.5
- Highlights on near trees for depth perception

**Parallax Effect**:
```javascript
// Far trees shift less than near trees
parallaxShift = (x - screenCenter) * (1 - depth) * 0.3
```

### Game Scene

**Core Loop**:
1. Update input (smooth interpolation)
2. Update player (physics, collision)
3. Update trees (approach, depth, parallax)
4. Check scoring (passed trees, distance)
5. Draw background (sky, mountains, snow)
6. Draw trees (sorted by depth)
7. Draw player (always on top)
8. Update snow particles (falling snow)

**Spawning**:
- Random tree spawning based on probability
- Minimum distance between trees enforced
- Trees spawn at far depth and approach

## Constants Configuration

All game tuning in `src/config/constants.js`:

**Physics**:
- `GRAVITY = 0.4` - Slope acceleration
- `FRICTION_PARALLEL = 0.995` - Low friction when straight
- `FRICTION_PERPENDICULAR = 0.88` - High friction when carving
- `MAX_SPEED = 28` - Speed cap

**Board**:
- `BOARD_LENGTH = 120` - Fixed board length
- `MAX_LEG_EXTENSION = 50` - Max foot movement from center
- `LEG_SPRING_STRENGTH = 0.15` - Spring pull strength
- `LEG_DAMPING = 0.85` - Movement smoothing

**3D Depth**:
- `TREE_START_DEPTH = 0.1` - Spawn distance (far)
- `DEPTH_SCALE_MIN = 0.2` - Min scale (far)
- `DEPTH_SCALE_MAX = 1.5` - Max scale (near)
- `DEPTH_SPEED_CURVE = 1.8` - Exponential approach rate
- `PARALLAX_STRENGTH = 0.3` - Parallax shift amount

## Future Enhancements

### Multiplayer (Phase 2)

**Planned Features**:
- Playroom Kit integration (like CometChaser)
- Race mode: compete for fastest time
- Versus mode: push opponents into trees
- Co-op mode: synchronized tricks

**Technical Approach**:
- Host-authoritative tree spawning
- Client prediction for player movement
- Position sync via WebRTC (unreliable, fast)
- Score sync via WebSockets (reliable)

### Visual Enhancements

1. **Better Graphics**
   - Textured snow surface
   - Animated pine trees (sway in wind)
   - Skid marks in snow
   - Dynamic shadows

2. **Effects**
   - Motion blur at high speeds
   - Screen shake on collision
   - Slow-motion near misses
   - Trick system (spins, grabs)

3. **Environment**
   - Weather effects (blizzard, clear)
   - Time of day (sunrise, sunset, night)
   - Multiple mountains/slopes
   - Ramps and jumps

### Gameplay Features

1. **Tricks System**
   - Grab bindings (Q/E keys)
   - Spins (multiple rotations)
   - Style points for tricks
   - Combo multiplier

2. **Power-ups**
   - Speed boosts
   - Shields (tree protection)
   - Magnet (collect items)
   - Time slow

3. **Progression**
   - Unlock new boards
   - Unlock new mountains
   - Challenges and achievements
   - Daily runs with leaderboards

## Development Notes

### Adding New Features

1. **Constants**: Add to `src/config/constants.js`
2. **Entities**: Create class in `src/entities/`
3. **Game Logic**: Add to `GameScene.js`
4. **UI**: Add to `UIScene.js`

### Debugging

Enable Phaser debug mode in `main.js`:
```javascript
physics: {
    arcade: {
        debug: true  // Shows collision boundaries
    }
}
```

### Performance Tips

- Limit tree count on screen (currently no hard limit)
- Use object pooling for snow particles
- Consider sprite sheets instead of graphics drawing
- Profile with Chrome DevTools

## Credits

Based on design document: `design_docs/Main_idea.txt`
Inspired by dual-foot control schemes and POV racing games
Built with Phaser 3 (Arcade Physics)
Modular architecture inspired by CometChaser project structure
