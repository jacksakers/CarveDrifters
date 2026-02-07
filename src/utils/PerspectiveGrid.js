import * as C from '../config/constants.js';

/**
 * PerspectiveGrid - Manages the 2D coordinate grid with vanishing point perspective
 * Creates lanes that narrow toward the top (vanishing point) and widen toward bottom (player)
 */
export default class PerspectiveGrid {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.centerX = screenWidth / 2;
        
        // Player's current lane position (float, center = 0)
        this.playerLaneOffset = 0;
    }
    
    /**
     * Get the X position for a given lane and depth
     * @param {number} lane - Lane index (-4 to +4 for 9 lanes, 0 is center)
     * @param {number} depth - Depth value (0.0 = far/top, 1.0 = near/bottom)
     * @returns {number} Screen X position
     */
    getLaneX(lane, depth) {
        // Grid width interpolates based on depth (perspective)
        // depth 0.0 (far) = narrow grid
        // depth 1.0 (near) = wide grid
        const gridWidth = C.GRID_WIDTH_FAR + (C.GRID_WIDTH_NEAR - C.GRID_WIDTH_FAR) * depth;
        
        // Calculate lane spacing at this depth
        const laneSpacing = gridWidth / (C.GRID_COLUMNS - 1);
        
        // Lane position relative to player's current lane offset
        const relativeLane = lane - this.playerLaneOffset;
        
        // Convert to screen position
        return this.centerX + (relativeLane * laneSpacing);
    }
    
    /**
     * Get screen Y position based on depth
     * @param {number} depth - Depth value (0.0 = far/top, 1.0 = near/bottom)
     * @returns {number} Screen Y position
     */
    getDepthY(depth) {
        const minY = 100; // Top of play area (vanishing point region)
        const maxY = this.screenHeight - 150; // Just before player
        return minY + (maxY - minY) * Math.min(depth, 1);
    }
    
    /**
     * Update player lane offset based on board angle
     * Player carving left/right shifts their lane position
     * @param {number} boardAngle - Current board angle in radians
     * @param {number} velocity - Player velocity
     */
    updatePlayerLane(boardAngle, velocity) {
        // Calculate horizontal component of board movement
        // Positive = moving right, Negative = moving left
        const horizontalAngle = Math.cos(boardAngle);
        
        // Shift player lane based on carving
        const laneShift = horizontalAngle * velocity * C.PLAYER_LANE_SHIFT_SPEED;
        this.playerLaneOffset += laneShift;
        
        // No bounds - player can shift infinitely (grid wraps conceptually)
    }
    
    /**
     * Get a random lane for tree spawning
     * Spawns lanes near the player's current position for infinite scrolling
     * @param {boolean} useInfinite - If true, spawn near player; if false, use original 9 lanes
     * @returns {number} Lane index
     */
    getRandomLane(useInfinite = false) {
        if (useInfinite) {
            // Spawn in a lane near the player's current position
            const playerLane = Math.round(this.playerLaneOffset);
            const range = Math.floor(C.GRID_COLUMNS / 2);
            const offset = Math.floor(Math.random() * range * 2) - range;
            return playerLane + offset;
        } else {
            // Original behavior: spawn in fixed -4 to +4 range, avoiding center
            const halfLanes = Math.floor(C.GRID_COLUMNS / 2);
            let lane;
            do {
                lane = Math.floor(Math.random() * C.GRID_COLUMNS) - halfLanes;
            } while (lane === 0); // Avoid center lane
            return lane;
        }
    }
    
    /**
     * Reset grid state
     */
    reset() {
        this.playerLaneOffset = 0;
    }
    
    /**
     * Debug: Draw grid lines
     */
    drawDebugGrid(graphics) {
        graphics.clear();
        graphics.lineStyle(1, 0x00ff00, 0.3);
        
        // Draw lane lines at various depths
        for (let d = 0; d <= 1; d += 0.1) {
            const y = this.getDepthY(d);
            
            // Draw horizontal line at this depth
            const leftX = this.getLaneX(-Math.floor(C.GRID_COLUMNS / 2), d);
            const rightX = this.getLaneX(Math.floor(C.GRID_COLUMNS / 2), d);
            graphics.lineBetween(leftX, y, rightX, y);
            
            // Draw vertical lane markers
            for (let lane = -Math.floor(C.GRID_COLUMNS / 2); lane <= Math.floor(C.GRID_COLUMNS / 2); lane++) {
                const x = this.getLaneX(lane, d);
                graphics.fillStyle(lane === 0 ? 0xff0000 : 0x00ff00, 0.5);
                graphics.fillCircle(x, y, 3);
            }
        }
    }
}
