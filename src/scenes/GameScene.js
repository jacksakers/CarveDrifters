import * as C from '../config/constants.js';
import InputManager from '../managers/InputManager.js';
import Player from '../entities/Player.js';
import Tree from '../entities/Tree.js';
import PerspectiveGrid from '../utils/PerspectiveGrid.js';

/**
 * GameScene - Main game loop
 * POV perspective: player at bottom, mountain rushing toward you
 */
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        // Start UI scene
        this.scene.launch('UIScene');
        
        // Perspective grid system
        this.grid = new PerspectiveGrid(this.scale.width, this.scale.height);
        
        // Managers
        this.inputManager = new InputManager(this);
        
        // Player (positioned at bottom of screen)
        const playerY = this.scale.height - 100; // 100px from bottom
        this.player = new Player(this, this.scale.width / 2, playerY);
        
        // Trees (obstacles)
        this.trees = [];
        
        // Background graphics
        this.bgGraphics = this.add.graphics();
        this.bgGraphics.setDepth(-10); // Far back
        this.treeGraphics = this.add.graphics();
        this.treeGraphics.setDepth(5); // In front of background, behind player
        this.snowGraphics = this.add.graphics();
        this.snowGraphics.setDepth(-5); // Behind trees
        
        // Snow particles (falling snow effect)
        this.snowParticles = [];
        this.createSnowParticles();
        
        // Game state
        this.gameActive = true;
        this.score = 0;
        this.distance = 0;
        
        // Frame counter for spawning
        this.frameCount = 0;
        
        // Tree sorting optimization
        this.lastTreeCount = 0;
        
        // Listen for player destroyed
        this.events.on('playerDestroyed', this.onPlayerDestroyed, this);
        
        // Create initial trees (populate grid lanes)
        for (let i = 0; i < 8; i++) {
            this.spawnTree();
        }
    }
    
    /**
     * Create falling snow particles
     */
    createSnowParticles() {
        for (let i = 0; i < C.SNOW_PARTICLE_COUNT; i++) {
            this.snowParticles.push({
                x: Math.random() * this.scale.width,
                y: Math.random() * this.scale.height,
                speed: Math.random() * 3 + 2,
                size: Math.random() * 4 + 2,
                sway: Math.random() * Math.PI * 2
            });
        }
    }
    
    /**
     * Spawn a new tree on a grid lane
     */
    spawnTree() {
        // Get a random lane from the grid
        const lane = this.grid.getRandomLane();
        
        // Check if another tree is already in this lane at far distance
        const laneOccupied = this.trees.some(tree => {
            return tree.lane === lane && tree.depth < 0.3;
        });
        
        if (laneOccupied) return; // Skip this spawn
        
        const size = C.TREE_MIN_SIZE + Math.random() * (C.TREE_MAX_SIZE - C.TREE_MIN_SIZE);
        const tree = new Tree(this, lane, size, this.grid);
        this.trees.push(tree);
    }
    
    /**
     * Update game state
     */
    update() {
        if (!this.gameActive) {
            // Allow restart
            if (this.inputManager.isSpacePressed()) {
                this.resetGame();
            }
            return;
        }

        this.frameCount++;

        // Update input
        const inputState = this.inputManager.update();

        // Update player
        this.player.update(inputState);
        
        // Update perspective grid based on player movement
        // Player carving left/right shifts their lane position
        this.grid.updatePlayerLane(this.player.angle, this.player.velocity);
        
        // Calculate debug info
        const downAngle = Math.PI / 2; // Straight down the slope
        const angleDiff = Math.abs(this.player.angle - downAngle);
        const alignment = 1 - Math.min(angleDiff / (Math.PI / 2), 1);
        const friction = C.FRICTION_PERPENDICULAR + (C.FRICTION_PARALLEL - C.FRICTION_PERPENDICULAR) * alignment;
        const feetDist = Math.sqrt(
            Math.pow(this.player.rightFoot.x - this.player.leftFoot.x, 2) + 
            Math.pow(this.player.rightFoot.y - this.player.leftFoot.y, 2)
        );
        
        // Emit debug info
        if (this.frameCount === 1) console.log('Emitting debug info...');
        this.events.emit('updateDebug', {
            boardAngle: this.player.angle,
            downhillDiff: angleDiff,
            alignment: alignment,
            speed: this.player.velocity,
            maxSpeed: C.MAX_SPEED,
            carvingAmount: this.player.carvingAmount,
            feetDistance: feetDist,
            leftFoot: this.player.leftFoot,
            rightFoot: this.player.rightFoot,
            frictionMultiplier: friction
        });
        
        // Update trees
        this.trees.forEach(tree => {
            tree.update(this.player.velocity);
            
            // Check collision
            if (this.player.checkTreeCollision(tree) && tree.depth > 0.7) {
                this.player.destroy('Hit a tree!');
            }
            
            // Check if player passed tree (for score)
            if (tree.hasPlayerPassed()) {
                tree.markScored();
                this.score += 10 * this.player.getCarvingBonus();
                this.events.emit('updateScore', Math.floor(this.score));
            }
        });
        
        // Remove dead trees
        this.trees = this.trees.filter(tree => tree.alive);
        
        // Spawn new trees with max limit
        if (Math.random() < C.TREE_SPAWN_RATE && this.trees.length < C.TREE_MAX_ON_SCREEN) {
            this.spawnTree();
        }
        
        // Ensure minimum number of trees on screen
        if (this.trees.length < 6) {
            this.spawnTree();
        }
        
        // Update score (distance)
        this.distance += this.player.velocity * C.DISTANCE_SCORE_RATE;
        this.score += this.player.velocity * C.DISTANCE_SCORE_RATE * this.player.getCarvingBonus();
        
        // Update UI
        this.events.emit('updateScore', Math.floor(this.score));
        this.events.emit('updateSpeed', this.player.getSpeedPercent());
        this.events.emit('updateCarving', this.player.carvingAmount);
        
        // Update snow particles
        this.updateSnowParticles();
        
        // Draw everything
        this.draw();
    }
    
    /**
     * Update falling snow
     */
    updateSnowParticles() {
        this.snowParticles.forEach(particle => {
            // Move down (relative to player speed for parallax)
            particle.y += particle.speed + this.player.velocity * 0.5;
            
            // Sway side to side
            particle.sway += 0.05;
            particle.x += Math.sin(particle.sway) * 0.5;
            
            // Wrap around
            if (particle.y > this.scale.height) {
                particle.y = 0;
                particle.x = Math.random() * this.scale.width;
            }
            
            if (particle.x < 0) particle.x = this.scale.width;
            if (particle.x > this.scale.width) particle.x = 0;
        });
    }
    
    /**
     * Draw all game elements
     */
    draw() {
        // Clear graphics
        this.bgGraphics.clear();
        this.treeGraphics.clear();
        this.snowGraphics.clear();
        
        // Get screen dimensions
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        
        // Draw background (gradient sky)
        this.drawBackground(screenWidth, screenHeight);
        
        // Draw snow particles
        this.drawSnow();
        
        // Debug: Draw grid lines (uncomment to visualize perspective grid)
        this.grid.drawDebugGrid(this.bgGraphics);
        
        // Sort trees by depth (far to near) - only sort if count changed
        if (this.lastTreeCount !== this.trees.length) {
            this.trees.sort((a, b) => a.depth - b.depth);
            this.lastTreeCount = this.trees.length;
        }
        
        // Draw trees
        this.trees.forEach(tree => {
            tree.draw(this.treeGraphics);
        });
        
        // Draw player (always on top)
        this.player.graphics.setDepth(10);
        this.player.draw();
    }
    
    /**
     * Draw background
     */
    drawBackground(screenWidth, screenHeight) {
        // Mountain silhouette at horizon
        const horizonY = 150;
        
        // Sky gradient (already CSS)
        
        // Mountain peaks (dark)
        this.bgGraphics.fillStyle(0x6b7280, 0.3);
        this.bgGraphics.beginPath();
        this.bgGraphics.moveTo(0, horizonY);
        
        for (let x = 0; x <= screenWidth; x += 50) {
            const y = horizonY - Math.sin(x * 0.01) * 40 - Math.cos(x * 0.03) * 20;
            this.bgGraphics.lineTo(x, y);
        }
        
        this.bgGraphics.lineTo(screenWidth, screenHeight);
        this.bgGraphics.lineTo(0, screenHeight);
        this.bgGraphics.closePath();
        this.bgGraphics.fillPath();
        
        // Snow slope (white gradient)
        this.bgGraphics.fillGradientStyle(0xffffff, 0xffffff, 0xe0f2ff, 0xe0f2ff, 1, 0.9, 0.95, 0.8);
        this.bgGraphics.fillRect(0, horizonY + 50, screenWidth, screenHeight);
    }
    
    /**
     * Draw falling snow
     */
    drawSnow() {
        this.snowParticles.forEach(particle => {
            // Draw snow as light blue/cyan particles on white background
            this.snowGraphics.fillStyle(0x87ceeb, 0.6);
            this.snowGraphics.fillCircle(particle.x, particle.y, particle.size);

            // Add a white highlight for shimmer effect
            this.snowGraphics.fillStyle(0xffffff, 0.8);
            this.snowGraphics.fillCircle(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.4);
        });
    }
    
    /**
     * Handle player destroyed
     */
    onPlayerDestroyed(data) {
        this.gameActive = false;
        this.events.emit('gameOver', {
            score: Math.floor(this.score),
            distance: Math.floor(this.distance),
            reason: data.reason
        });
    }
    
    /**
     * Reset game
     */
    resetGame() {
        this.gameActive = true;
        this.score = 0;
        this.distance = 0;
        this.frameCount = 0;
        
        // Reset grid
        this.grid.reset();
        
        // Reset player
        this.player.x = this.scale.width / 2;
        this.player.y = this.scale.height - 100;
        this.inputManager.reset();
        
        // Clear trees
        this.trees = [];
        for (let i = 0; i < 8; i++) {
            this.spawnTree();
        }
        
        // Reset snow
        this.snowParticles.forEach(particle => {
            particle.y = Math.random() * C.GAME_HEIGHT;
        });
        
        this.events.emit('gameReset');
    }
}
