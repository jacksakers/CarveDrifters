import * as C from '../config/constants.js';
import InputManager from '../managers/InputManager.js';
import Player from '../entities/Player.js';
import Tree from '../entities/Tree.js';

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
        
        // Movement effect - offset trees based on board velocity
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        
        // Frame counter for spawning
        this.frameCount = 0;
        
        // Tree sorting optimization
        this.lastTreeCount = 0;
        
        // Listen for player destroyed
        this.events.on('playerDestroyed', this.onPlayerDestroyed, this);
        
        // Create initial trees
        for (let i = 0; i < 5; i++) {
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
     * Spawn a new tree
     */
    spawnTree() {
        // Determine spawn bias based on board angle
        // When moving right (angle ~0 to -90), spawn more on left
        // When moving left (angle ~-90 to -180), spawn more on right
        const boardAngle = this.player.angle;
        const sideX = Math.sin(boardAngle);
        
        // Create weighted distribution - bias trees to spawn opposite side of movement
        const centerX = this.scale.width / 2;
        const halfWidth = this.scale.width / 3;
        
        let x;
        if (sideX > 0.3) {
            // Moving right - spawn trees on left side
            x = centerX - halfWidth + Math.random() * halfWidth * 0.8;
        } else if (sideX < -0.3) {
            // Moving left - spawn trees on right side
            x = centerX + halfWidth * 0.2 + Math.random() * halfWidth * 0.8;
        } else {
            // Moving straight - spawn anywhere
            const margin = 100;
            x = margin + Math.random() * (this.scale.width - margin * 2);
        }
        
        // Clamp to valid range
        x = Math.max(50, Math.min(this.scale.width - 50, x));
        
        // Check if too close to existing trees at spawn
        const tooClose = this.trees.some(tree => {
            if (tree.depth < 0.3) { // Only check trees that are far away
                return Math.abs(tree.x - x) < C.TREE_MIN_DISTANCE;
            }
            return false;
        });
        
        if (tooClose) return; // Skip this spawn
        
        const size = C.TREE_MIN_SIZE + Math.random() * (C.TREE_MAX_SIZE - C.TREE_MIN_SIZE);
        const tree = new Tree(this, x, size);
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
        
        // Update camera offset based on player velocity and board angle
        // The board angle determines direction of travel
        // Trees move opposite to the board direction to create movement illusion
        const boardAngle = this.player.angle;
        
        // Apply velocity as movement offset (trees move opposite direction)
        // Higher multiplier = faster lateral movement for dramatic weaving effect
        const offsetMagnitude = this.player.velocity * 2.5;
        this.cameraOffsetX -= Math.cos(boardAngle) * offsetMagnitude;
        this.cameraOffsetY -= Math.sin(boardAngle) * offsetMagnitude;
        
        // Wrap offset to prevent infinite accumulation and floating point precision issues
        const offsetBounds = 5000;
        if (this.cameraOffsetX < -offsetBounds) this.cameraOffsetX += offsetBounds * 2;
        if (this.cameraOffsetX > offsetBounds) this.cameraOffsetX -= offsetBounds * 2;
        if (this.cameraOffsetY < -offsetBounds) this.cameraOffsetY += offsetBounds * 2;
        if (this.cameraOffsetY > offsetBounds) this.cameraOffsetY -= offsetBounds * 2;
        
        // Calculate debug info
        const downAngle = Math.PI / 2; // Pointing down
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
            tree.setOffset(this.cameraOffsetX, this.cameraOffsetY);
            
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
        
        // Reset player
        this.player.x = this.scale.width / 2;
        this.player.y = this.scale.height - 100;
        this.inputManager.reset();
        
        // Clear trees
        this.trees = [];
        for (let i = 0; i < 5; i++) {
            this.spawnTree();
        }
        
        // Reset snow
        this.snowParticles.forEach(particle => {
            particle.y = Math.random() * C.GAME_HEIGHT;
        });
        
        this.events.emit('gameReset');
    }
}
