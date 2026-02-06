import * as C from '../config/constants.js';

/**
 * InputManager - Handles dual-foot controls with center-snapping
 * Simulates joystick-style input for smooth, fluid control
 */
export default class InputManager {
    constructor(scene) {
        this.scene = scene;

        // Home positions for each foot (where they return to when released)
        this.leftFootHome = { x: -C.BOARD_LENGTH / 3, y: 0 }; // Left foot home on left side
        this.rightFootHome = { x: C.BOARD_LENGTH / 3, y: 0 }; // Right foot home on right side

        // Current input state - initialize to home positions
        this.leftFoot = { x: this.leftFootHome.x, y: this.leftFootHome.y };
        this.rightFoot = { x: this.rightFootHome.x, y: this.rightFootHome.y };
        
        // Velocity for smooth interpolation
        this.leftVelocity = { x: 0, y: 0 };
        this.rightVelocity = { x: 0, y: 0 };
        
        // Setup keyboard input
        this.keys = {
            w: scene.input.keyboard.addKey('W'),
            a: scene.input.keyboard.addKey('A'),
            s: scene.input.keyboard.addKey('S'),
            d: scene.input.keyboard.addKey('D'),
            up: scene.input.keyboard.addKey('UP'),
            down: scene.input.keyboard.addKey('DOWN'),
            left: scene.input.keyboard.addKey('LEFT'),
            right: scene.input.keyboard.addKey('RIGHT'),
            space: scene.input.keyboard.addKey('SPACE')
        };
    }
    
    /**
     * Update input state - call every frame
     * Returns smooth, interpolated foot positions
     */
    update() {
        // Get raw input
        const leftInput = this.getLeftInput();
        const rightInput = this.getRightInput();
        
        // Apply dead zone
        const leftMag = Math.sqrt(leftInput.x * leftInput.x + leftInput.y * leftInput.y);
        const rightMag = Math.sqrt(rightInput.x * rightInput.x + rightInput.y * rightInput.y);
        
        // Spring physics: pull toward input target only when input is active
        // When no input, feet freeze in place (velocity is zeroed)
        if (leftMag > C.DEAD_ZONE) {
            const leftTarget = {
                x: leftInput.x * C.INPUT_SENSITIVITY * C.MAX_INPUT,
                y: leftInput.y * C.INPUT_SENSITIVITY * C.MAX_INPUT
            };
            this.leftVelocity.x += (leftTarget.x - this.leftFoot.x) * C.LEG_SPRING_STRENGTH;
            this.leftVelocity.y += (leftTarget.y - this.leftFoot.y) * C.LEG_SPRING_STRENGTH;
        } else {
            // No input: freeze the foot in place (zero velocity)
            this.leftVelocity.x = 0;
            this.leftVelocity.y = 0;
        }

        if (rightMag > C.DEAD_ZONE) {
            const rightTarget = {
                x: rightInput.x * C.INPUT_SENSITIVITY * C.MAX_INPUT,
                y: rightInput.y * C.INPUT_SENSITIVITY * C.MAX_INPUT
            };
            this.rightVelocity.x += (rightTarget.x - this.rightFoot.x) * C.LEG_SPRING_STRENGTH;
            this.rightVelocity.y += (rightTarget.y - this.rightFoot.y) * C.LEG_SPRING_STRENGTH;
        } else {
            // No input: freeze the foot in place (velocity is zeroed)
            this.rightVelocity.x = 0;
            this.rightVelocity.y = 0;
        }
        
        // Apply damping
        this.leftVelocity.x *= C.LEG_DAMPING;
        this.leftVelocity.y *= C.LEG_DAMPING;
        this.rightVelocity.x *= C.LEG_DAMPING;
        this.rightVelocity.y *= C.LEG_DAMPING;
        
        // Update positions
        this.leftFoot.x += this.leftVelocity.x;
        this.leftFoot.y += this.leftVelocity.y;
        this.rightFoot.x += this.rightVelocity.x;
        this.rightFoot.y += this.rightVelocity.y;
        
        // Clamp to max extension
        const leftDist = Math.sqrt(this.leftFoot.x * this.leftFoot.x + this.leftFoot.y * this.leftFoot.y);
        if (leftDist > C.MAX_LEG_EXTENSION) {
            this.leftFoot.x = (this.leftFoot.x / leftDist) * C.MAX_LEG_EXTENSION;
            this.leftFoot.y = (this.leftFoot.y / leftDist) * C.MAX_LEG_EXTENSION;
        }
        
        const rightDist = Math.sqrt(this.rightFoot.x * this.rightFoot.x + this.rightFoot.y * this.rightFoot.y);
        if (rightDist > C.MAX_LEG_EXTENSION) {
            this.rightFoot.x = (this.rightFoot.x / rightDist) * C.MAX_LEG_EXTENSION;
            this.rightFoot.y = (this.rightFoot.y / rightDist) * C.MAX_LEG_EXTENSION;
        }
        
        // Enforce minimum distance between feet
        const dx = this.rightFoot.x - this.leftFoot.x;
        const dy = this.rightFoot.y - this.leftFoot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < C.MIN_FEET_DISTANCE && dist > 0) {
            const pushX = (dx / dist) * (C.MIN_FEET_DISTANCE - dist) * 0.5;
            const pushY = (dy / dist) * (C.MIN_FEET_DISTANCE - dist) * 0.5;
            this.leftFoot.x -= pushX;
            this.leftFoot.y -= pushY;
            this.rightFoot.x += pushX;
            this.rightFoot.y += pushY;
        }
        
        return {
            leftFoot: this.leftFoot,
            rightFoot: this.rightFoot
        };
    }
    
    /**
     * Get left foot input (WASD)
     */
    getLeftInput() {
        const input = { x: 0, y: 0 };
        
        if (this.keys.a.isDown) input.x -= 1;
        if (this.keys.d.isDown) input.x += 1;
        if (this.keys.w.isDown) input.y -= 1;
        if (this.keys.s.isDown) input.y += 1;
        
        return input;
    }
    
    /**
     * Get right foot input (Arrow Keys)
     */
    getRightInput() {
        const input = { x: 0, y: 0 };
        
        if (this.keys.left.isDown) input.x -= 1;
        if (this.keys.right.isDown) input.x += 1;
        if (this.keys.up.isDown) input.y -= 1;
        if (this.keys.down.isDown) input.y += 1;
        
        return input;
    }
    
    /**
     * Check if space is pressed (for restart)
     */
    isSpacePressed() {
        return this.keys.space.isDown;
    }
    
    /**
     * Reset positions
     */
    reset() {
        this.leftFoot = { x: this.leftFootHome.x, y: this.leftFootHome.y };
        this.rightFoot = { x: this.rightFootHome.x, y: this.rightFootHome.y };
        this.leftVelocity = { x: 0, y: 0 };
        this.rightVelocity = { x: 0, y: 0 };
    }
}
