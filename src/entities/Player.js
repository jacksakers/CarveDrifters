import * as C from '../config/constants.js';

/**
 * Player Entity - Snowboarder with dual-foot control
 * Controls individual feet to steer the board
 */
export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Feet positions (relative to center)
        this.leftFoot = { x: -C.BOARD_LENGTH / 3, y: 0 };
        this.rightFoot = { x: C.BOARD_LENGTH / 3, y: 0 };
        
        // Physics
        this.velocity = C.MAX_SPEED * 0.4; // Start at 40% of max speed
        this.angle = 0; // Board angle (radians)
        this.alive = true;
        
        // Visual
        this.graphics = scene.add.graphics();
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = C.SNOW_TRAIL_LENGTH;
        
        // Style/carving detection
        this.carvingAmount = 0; // 0-1, how much sideways angle
        
        // Stopped timer
        this.stoppedFrames = 0;
    }
    
    /**
     * Update player based on input
     */
    update(inputState) {
        if (!this.alive) return;

        // Update feet positions from input (smoothed by InputManager)
        this.leftFoot = inputState.leftFoot;
        this.rightFoot = inputState.rightFoot;

        // Calculate board angle from feet positions
        const dx = this.rightFoot.x - this.leftFoot.x;
        const dy = this.rightFoot.y - this.leftFoot.y;
        this.angle = Math.atan2(dy, dx);

        // Calculate alignment with downward direction (0 = straight down)
        const downAngle = Math.PI / 2; // Pointing down
        const angleDiff = Math.abs(this.angle - downAngle);
        const alignment = 1 - Math.min(angleDiff / (Math.PI / 2), 1); // 1 = straight, 0 = perpendicular

        // Calculate carving amount (how sideways we are)
        this.carvingAmount = 1 - alignment;

        // Apply acceleration based on alignment
        const oldVelocity = this.velocity;
        if (alignment > 0.7) {
            // Going mostly straight - accelerate
            this.velocity += C.GRAVITY * alignment;
        } else {
            // Carving/braking - friction
            const friction = C.FRICTION_PERPENDICULAR + (C.FRICTION_PARALLEL - C.FRICTION_PERPENDICULAR) * alignment;
            this.velocity *= friction;
        }

        // Clamp velocity
        this.velocity = Math.max(C.MIN_SPEED, Math.min(C.MAX_SPEED, this.velocity));

        // Check if stopped
        if (this.velocity < C.MIN_SPEED * 1.5) {
            this.stoppedFrames++;
            // if (this.stoppedFrames > C.STOPPED_THRESHOLD) {
            //     this.destroy('Lost momentum');
            // }
        } else {
            this.stoppedFrames = 0;
        }

        // Add to trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Fade trail
        this.trail.forEach((point, i) => {
            point.alpha = i / this.trail.length;
        });
    }
    
    /**
     * Draw the player (board and feet)
     */
    draw() {
        this.graphics.clear();
        
        if (!this.alive) return;
        
        // Draw trail
        this.drawTrail();
        
        // Board center
        const cx = this.x;
        const cy = this.y;
        
        // Calculate absolute foot positions
        const leftX = cx + this.leftFoot.x;
        const leftY = cy + this.leftFoot.y;
        const rightX = cx + this.rightFoot.x;
        const rightY = cy + this.rightFoot.y;
        
        // Draw board as a filled rectangle
        const boardAngle = this.angle;
        const boardHalfLength = C.BOARD_LENGTH / 2;
        const boardHalfWidth = C.BOARD_WIDTH / 2;

        // Board endpoints (extended beyond feet)
        const noseX = cx + Math.cos(boardAngle) * boardHalfLength;
        const noseY = cy + Math.sin(boardAngle) * boardHalfLength;
        const tailX = cx - Math.cos(boardAngle) * boardHalfLength;
        const tailY = cy - Math.sin(boardAngle) * boardHalfLength;

        // Perpendicular direction for board width
        const perpX = Math.cos(boardAngle + Math.PI / 2);
        const perpY = Math.sin(boardAngle + Math.PI / 2);

        // Board corners
        const corners = [
            { x: tailX + perpX * boardHalfWidth, y: tailY + perpY * boardHalfWidth },
            { x: noseX + perpX * boardHalfWidth, y: noseY + perpY * boardHalfWidth },
            { x: noseX - perpX * boardHalfWidth, y: noseY - perpY * boardHalfWidth },
            { x: tailX - perpX * boardHalfWidth, y: tailY - perpY * boardHalfWidth }
        ];

        // Draw board shadow
        this.graphics.fillStyle(0x000000, 0.3);
        this.graphics.beginPath();
        this.graphics.moveTo(corners[0].x + 3, corners[0].y + 3);
        this.graphics.lineTo(corners[1].x + 3, corners[1].y + 3);
        this.graphics.lineTo(corners[2].x + 3, corners[2].y + 3);
        this.graphics.lineTo(corners[3].x + 3, corners[3].y + 3);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Draw board
        const boardColor = this.carvingAmount > 0.5 ? 0xf59e0b : 0xd4a574; // Orange when carving, lighter brown normally
        this.graphics.fillStyle(boardColor, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(corners[0].x, corners[0].y);
        this.graphics.lineTo(corners[1].x, corners[1].y);
        this.graphics.lineTo(corners[2].x, corners[2].y);
        this.graphics.lineTo(corners[3].x, corners[3].y);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Draw board edge highlight
        this.graphics.lineStyle(2, 0xffffff, 0.5);
        this.graphics.beginPath();
        this.graphics.moveTo(tailX, tailY);
        this.graphics.lineTo(noseX, noseY);
        this.graphics.strokePath();
        
        // Draw bindings (where feet connect)
        this.graphics.fillStyle(0x1e3a8a, 1);
        this.graphics.fillCircle(leftX, leftY, C.FOOT_RADIUS + 2);
        this.graphics.fillCircle(rightX, rightY, C.FOOT_RADIUS + 2);
        
        // Draw feet
        this.graphics.fillStyle(0x3b82f6, 1); // Left foot (blue)
        this.graphics.fillCircle(leftX, leftY, C.FOOT_RADIUS);
        
        this.graphics.fillStyle(0xef4444, 1); // Right foot (red)
        this.graphics.fillCircle(rightX, rightY, C.FOOT_RADIUS);
        
        // Foot highlights
        this.graphics.fillStyle(0xffffff, 0.5);
        this.graphics.fillCircle(leftX - 3, leftY - 3, C.FOOT_RADIUS / 3);
        this.graphics.fillCircle(rightX - 3, rightY - 3, C.FOOT_RADIUS / 3);
        
        // Snow spray when carving
        if (this.carvingAmount > 0.4) {
            this.createSnowSpray();
        }
    }
    
    /**
     * Draw snow trail behind player
     */
    drawTrail() {
        if (this.trail.length < 2) return;
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i + 1];
            
            this.graphics.lineStyle(3, 0xffffff, p1.alpha * 0.3);
            this.graphics.beginPath();
            this.graphics.moveTo(p1.x, p1.y);
            this.graphics.lineTo(p2.x, p2.y);
            this.graphics.strokePath();
        }
    }
    
    /**
     * Create snow spray particles when carving
     */
    createSnowSpray() {
        // Emit from the back edge of the board
        const sprayX = this.x - Math.cos(this.angle) * (C.BOARD_LENGTH / 2);
        const sprayY = this.y - Math.sin(this.angle) * (C.BOARD_LENGTH / 2);
        
        for (let i = 0; i < C.SNOW_SPRAY_PARTICLES; i++) {
            const angle = this.angle + Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 4 + 2;
            
            // Simple particle effect (could be enhanced)
            this.graphics.fillStyle(0xffffff, 0.6);
            this.graphics.fillCircle(
                sprayX + Math.cos(angle) * 10,
                sprayY + Math.sin(angle) * 10,
                size
            );
        }
    }
    
    /**
     * Check collision with tree
     */
    checkTreeCollision(tree) {
        if (!this.alive) return false;
        
        // Simple circle collision
        const dx = this.x - tree.getX();
        const dy = this.y - tree.getY();
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const collisionRadius = (C.BOARD_LENGTH / 2) + (tree.size * tree.depth * 0.4);
        
        return distance < collisionRadius;
    }
    
    /**
     * Get current speed as percentage
     */
    getSpeedPercent() {
        return this.velocity / C.MAX_SPEED;
    }
    
    /**
     * Get carving bonus multiplier
     */
    getCarvingBonus() {
        return this.carvingAmount > 0.5 ? C.STYLE_SCORE_MULTIPLIER : 1.0;
    }
    
    /**
     * Destroy player (game over)
     */
    destroy(reason) {
        this.alive = false;
        this.scene.events.emit('playerDestroyed', { reason });
    }
    
    /**
     * Reset player state
     */
    reset() {
        // this.x = C.GAME_WIDTH / 2;
        // this.y = C.PLAYER_START_Y;
        this.velocity = C.MAX_SPEED * 0.4; // Start at 40% of max speed
        this.angle = Math.PI / 2;
        this.leftFoot = { x: -C.BOARD_LENGTH / 3, y: 0 };
        this.rightFoot = { x: C.BOARD_LENGTH / 3, y: 0 };
        this.trail = [];
        this.alive = true;
        this.stoppedFrames = 0;
        this.carvingAmount = 0;
    }
}
