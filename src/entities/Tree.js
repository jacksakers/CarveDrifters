import * as C from '../config/constants.js';

/**
 * Tree Entity - Obstacle with 3D depth effect
 * Starts small (far) and grows as it approaches (near)
 */
export default class Tree {
    constructor(scene, x, baseSize) {
        this.scene = scene;
        this.x = x;
        this.baseSize = baseSize;
        this.size = baseSize;
        
        // Depth: 0 = far (small), 1 = at player (full size)
        this.depth = C.TREE_START_DEPTH;
        
        // Visual properties
        this.color = this.randomTreeColor();
        this.type = Math.random() > 0.5 ? 'pine' : 'rounded';
        
        // Camera offset for movement effect
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.alive = true;
        this.scored = false; // Track if player passed this tree
    }
    
    /**
     * Random tree color for variety
     */
    randomTreeColor() {
        const colors = [
            0x1e5128, // Dark green
            0x2d6a4f, // Medium green
            0x40916c, // Light green
            0x52796f  // Muted green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Update tree (approach player)
     */
    update(playerSpeed) {
        if (!this.alive) return;
        
        // Calculate approach speed (faster trees approach faster - creates depth)
        const approachSpeed = C.TREE_BASE_SPEED + (playerSpeed * C.TREE_SPEED_MULTIPLIER * 0.1);
        
        // Increase depth exponentially (creates acceleration effect)
        this.depth += approachSpeed * 0.01 * Math.pow(this.depth + 0.1, C.DEPTH_SPEED_CURVE);
        
        // Calculate visual size based on depth
        const scale = C.DEPTH_SCALE_MIN + (C.DEPTH_SCALE_MAX - C.DEPTH_SCALE_MIN) * 
                      Math.min(this.depth, 1);
        this.size = this.baseSize * scale;
        
        // Remove if past player or too large
        if (this.depth > C.TREE_MAX_DEPTH) {
            this.alive = false;
        }
        
        // Apply parallax effect (trees shift based on player position - creates depth)
        // Trees further away move less than closer trees
        const parallaxShift = (this.x - C.GAME_WIDTH / 2) * (1 - this.depth) * C.PARALLAX_STRENGTH;
        this.visualX = this.x + parallaxShift;
    }
    
    /**
     * Set camera offset for movement effect
     * Trees move opposite to board direction to create illusion of forward movement
     */
    setOffset(offsetX, offsetY) {
        // Apply offset based on depth - closer trees move more dramatically
        const depthFactor = Math.min(this.depth, 1);
        this.offsetX = offsetX * depthFactor;
        this.offsetY = offsetY * depthFactor;
    }
    
    /**
     * Get screen Y position based on depth
     * Objects further away appear higher on screen
     */
    getY() {
        // Map depth to screen position
        // depth 0.0 = top of screen (far)
        // depth 1.0 = player position (near)
        const minY = 100; // Top of play area
        const maxY = this.scene.scale.height - 150; // Just before player
        
        return minY + (maxY - minY) * Math.min(this.depth, 1);
    }
    
    /**
     * Draw the tree with 3D perspective
     */
    draw(graphics) {
        if (!this.alive) return;
        
        const x = this.visualX + this.offsetX;
        const y = this.getY() + this.offsetY;
        
        // Opacity based on depth (far = more transparent)
        const opacity = 0.3 + 0.7 * Math.min(this.depth, 1);
        
        // Shadow (only for near trees)
        if (this.depth > 0.5) {
            const shadowOffset = this.size * 0.2;
            const shadowAlpha = 0.3 * (this.depth - 0.5) * 2;
            
            graphics.fillStyle(0x000000, shadowAlpha);
            if (this.type === 'pine') {
                this.drawPineTree(graphics, x + shadowOffset, y + shadowOffset, this.size * 1.1, 0x000000, shadowAlpha * 0.5);
            } else {
                this.drawRoundedTree(graphics, x + shadowOffset, y + shadowOffset, this.size * 1.1, 0x000000, shadowAlpha * 0.5);
            }
        }
        
        // Draw tree
        if (this.type === 'pine') {
            this.drawPineTree(graphics, x, y, this.size, this.color, opacity);
        } else {
            this.drawRoundedTree(graphics, x, y, this.size, this.color, opacity);
        }
    }
    
    /**
     * Draw pine tree (triangle)
     */
    drawPineTree(graphics, x, y, size, color, opacity) {
        const height = size;
        const width = size * 0.7;
        
        // Tree body (3 overlapping triangles)
        graphics.fillStyle(color, opacity);
        
        // Bottom triangle
        graphics.beginPath();
        graphics.moveTo(x, y - height * 0.2);
        graphics.lineTo(x - width * 0.6, y + height * 0.4);
        graphics.lineTo(x + width * 0.6, y + height * 0.4);
        graphics.closePath();
        graphics.fillPath();
        
        // Middle triangle
        graphics.beginPath();
        graphics.moveTo(x, y - height * 0.5);
        graphics.lineTo(x - width * 0.5, y + height * 0.1);
        graphics.lineTo(x + width * 0.5, y + height * 0.1);
        graphics.closePath();
        graphics.fillPath();
        
        // Top triangle
        graphics.beginPath();
        graphics.moveTo(x, y - height * 0.8);
        graphics.lineTo(x - width * 0.4, y - height * 0.2);
        graphics.lineTo(x + width * 0.4, y - height * 0.2);
        graphics.closePath();
        graphics.fillPath();
        
        // Trunk
        graphics.fillStyle(0x4a3728, opacity);
        graphics.fillRect(x - size * 0.1, y + height * 0.3, size * 0.2, size * 0.3);
        
        // Highlight
        if (this.depth > 0.3) {
            graphics.fillStyle(0xffffff, opacity * 0.2);
            graphics.beginPath();
            graphics.moveTo(x - width * 0.2, y - height * 0.6);
            graphics.lineTo(x, y - height * 0.8);
            graphics.lineTo(x, y - height * 0.5);
            graphics.closePath();
            graphics.fillPath();
        }
    }
    
    /**
     * Draw rounded tree (circles)
     */
    drawRoundedTree(graphics, x, y, size, color, opacity) {
        const radius = size * 0.5;
        
        // Trunk
        graphics.fillStyle(0x4a3728, opacity);
        graphics.fillRect(x - size * 0.1, y + radius * 0.5, size * 0.2, size * 0.6);
        
        // Foliage (3 circles)
        graphics.fillStyle(color, opacity);
        graphics.fillCircle(x, y - radius * 0.5, radius);
        graphics.fillCircle(x - radius * 0.4, y, radius * 0.8);
        graphics.fillCircle(x + radius * 0.4, y, radius * 0.8);
        
        // Highlight
        if (this.depth > 0.3) {
            graphics.fillStyle(0xffffff, opacity * 0.3);
            graphics.fillCircle(x - radius * 0.3, y - radius * 0.7, radius * 0.3);
        }
    }
    
    /**
     * Check if tree is off screen
     */
    isOffScreen() {
        return !this.alive;
    }
    
    /**
     * Mark as scored (player passed)
     */
    markScored() {
        this.scored = true;
    }
    
    /**
     * Check if player passed this tree
     */
    hasPlayerPassed() {
        return this.depth > 0.9 && !this.scored;
    }
}
