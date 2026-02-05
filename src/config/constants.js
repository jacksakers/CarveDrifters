// Carve Drifters - Game Constants

// Display Settings
export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 800;
export const BACKGROUND_COLOR = '#ffffff';

// Physics Settings
export const GRAVITY = 0.4; // Downward slope acceleration
export const FRICTION_PARALLEL = 0.995; // Low friction when aligned with board
export const FRICTION_PERPENDICULAR = 0.88; // High friction when sideways (carving/braking)
export const MAX_SPEED = 28;
export const MIN_SPEED = 2; // Minimum speed to stay alive

// Player/Board Settings
export const BOARD_LENGTH = 140; // Fixed board length
export const BOARD_WIDTH = 35;
export const FOOT_RADIUS = 12;
export const MAX_LEG_EXTENSION = 50; // Max distance feet can move from center
export const MIN_FEET_DISTANCE = 80; // Minimum distance between feet
export const LEG_SPRING_STRENGTH = 0.08; // How strongly feet snap back to center
export const LEG_DAMPING = 0.90; // Damping for smooth motion
export const PLAYER_START_Y = 700; // Player position (bottom of screen)

// Input Settings
export const INPUT_SENSITIVITY = 1.8; // Joystick-style input strength
export const DEAD_ZONE = 0.1; // Center dead zone
export const MAX_INPUT = 50; // Maximum input displacement

// Tree/Obstacle Settings
export const TREE_MIN_SIZE = 40;
export const TREE_MAX_SIZE = 120;
export const TREE_SPAWN_RATE = 0.015; // Probability per frame
export const TREE_BASE_SPEED = 2.5; // Base tree approach speed
export const TREE_SPEED_MULTIPLIER = 1.5; // Speed increases with player speed
export const TREE_MIN_DISTANCE = 150; // Minimum horizontal distance between trees
export const TREE_START_DEPTH = 0.1; // Start small (far away)
export const TREE_MAX_DEPTH = 2.0; // Maximum size (close)

// Depth/3D Effect Settings
export const DEPTH_SCALE_MIN = 0.2; // Minimum scale (far)
export const DEPTH_SCALE_MAX = 1.5; // Maximum scale (near)
export const DEPTH_SPEED_CURVE = 1.8; // How quickly things approach (exponential)
export const PARALLAX_STRENGTH = 0.3; // Background parallax effect

// Snow Effects
export const SNOW_PARTICLE_COUNT = 120;
export const SNOW_TRAIL_LENGTH = 15;
export const SNOW_SPRAY_PARTICLES = 5; // Particles per frame when carving

// UI Settings
export const UI_FONT_FAMILY = 'Arial, sans-serif';
export const UI_FONT_SIZE = 18;
export const UI_COLOR = '#1e3a8a';
export const UI_PADDING = 20;

// Score Settings
export const DISTANCE_SCORE_RATE = 0.1; // Points per frame of distance
export const STYLE_SCORE_MULTIPLIER = 2.0; // Bonus for carving

// Game Over Conditions
export const COLLISION_DAMAGE = 100; // Instant game over on tree hit
export const STOPPED_THRESHOLD = 60; // Frames at low speed before game over
