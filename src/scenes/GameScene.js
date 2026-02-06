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
        // Managers
        this.inputManager = new InputManager(this);
        
        // Player (positioned at bottom of screen)
        const playerY = this.scale.height - 100; // 100px from bottom
        this.player = new Player(this, this.scale.width / 2, playerY);
        
        // Trees (obstacles)
        this.trees = [];
        
        // Background graphics
        this.bgGraphics = this.add.graphics();
        this.treeGraphics = this.add.graphics();
        this.snowGraphics = this.add.graphics();
        
        // Snow particles (falling snow effect)
        this.snowParticles = [];
        this.createSnowParticles();
        
        // Game state
        this.gameActive = true;
        this.score = 0;
        this.distance = 0;
        
        // Frame counter for spawning
        this.frameCount = 0;
        
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
        // Random X position, avoiding edges
        const margin = 100;
        const x = margin + Math.random() * (this.scale.width - margin * 2);
        
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
        
        // Spawn new trees more aggressively
        if (Math.random() < C.TREE_SPAWN_RATE) {
            this.spawnTree();
        }
        
        // Ensure minimum number of trees on screen
        if (this.trees.length < 8) {
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
        
        // // Draw background (gradient sky)
        // this.drawBackground(screenWidth, screenHeight);
        
        // // Draw snow particles
        // this.drawSnow();
        
        // // Sort trees by depth (far to near)
        // this.trees.sort((a, b) => a.depth - b.depth);
        
        // // Draw trees
        // this.trees.forEach(tree => {
        //     tree.draw(this.treeGraphics);
        // });
        
        // Draw player (always on top)
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
