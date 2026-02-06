import * as C from '../config/constants.js';

/**
 * UIScene - Overlay HUD for score, speed, and game over
 */
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }
    
    create() {
        // Get reference to game scene
        this.gameScene = this.scene.get('GameScene');
        
        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
        
        // Create UI components
        this.createHeader();
        this.createSpeedIndicator();
        this.createDebugInfo();
        this.createControlsHint();
        this.createGameOverScreen();
        
        // Listen to events
        this.gameScene.events.on('updateScore', this.updateScore, this);
        this.gameScene.events.on('updateSpeed', this.updateSpeed, this);
        this.gameScene.events.on('updateCarving', this.updateCarving, this);
        this.gameScene.events.on('gameOver', this.showGameOver, this);
        this.gameScene.events.on('gameReset', this.hideGameOver, this);
        this.gameScene.events.on('updateDebug', this.updateDebugInfo, this);
    }
    
    /**
     * Create header with title and score
     */
    createHeader() {
        const bounds = this.getUIBounds();
        const x = bounds.left;
        const y = bounds.top;
        
        // Title
        this.titleText = this.add.text(x, y, '🏂 CARVE DRIFTERS', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '28px',
            color: C.UI_COLOR,
            fontStyle: 'bold'
        }).setScrollFactor(0);
        
        // Score
        this.scoreText = this.add.text(x, y + 40, 'Score: 0', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '20px',
            color: C.UI_COLOR,
            fontStyle: 'bold'
        }).setScrollFactor(0);
        
        // Carving indicator
        this.carvingText = this.add.text(x, y + 70, '', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '16px',
            color: '#f59e0b',
            fontStyle: 'bold'
        }).setScrollFactor(0);
    }
    
    /**
     * Get UI boundaries for responsive layout
     */
    getUIBounds() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        return {
            left: C.UI_PADDING,
            right: screenWidth - C.UI_PADDING,
            top: C.UI_PADDING,
            bottom: screenHeight - C.UI_PADDING,
            centerX: screenWidth / 2,
            centerY: screenHeight / 2
        };
    }
    
    /**
     * Create speed indicator bar
     */
    createSpeedIndicator() {
        const bounds = this.getUIBounds();
        const width = 200;
        const height = 30;
        const x = bounds.right - width;
        const y = bounds.top;
        
        // Label
        this.speedLabel = this.add.text(x + width / 2, y - 25, 'SPEED', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '14px',
            color: C.UI_COLOR,
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Background
        this.speedBarBg = this.add.graphics();
        this.speedBarBg.fillStyle(0x000000, 0.3);
        this.speedBarBg.fillRoundedRect(x, y, width, height, 5);
        this.speedBarBg.lineStyle(2, 0x1e3a8a, 0.6);
        this.speedBarBg.strokeRoundedRect(x, y, width, height, 5);
        this.speedBarBg.setScrollFactor(0);
        
        // Bar
        this.speedBar = this.add.graphics();
        this.speedBar.setScrollFactor(0);
        
        this.speedBarX = x;
        this.speedBarY = y;
        this.speedBarWidth = width;
        this.speedBarHeight = height;
    }
    
    /**
     * Create debug info display
     */
    createDebugInfo() {
        const bounds = this.getUIBounds();
        const x = bounds.left;
        const y = bounds.top + 120;
        
        this.debugContainer = this.add.container(x, y);
        
        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(0, 0, 320, 200, 8);
        bg.lineStyle(2, 0x3b82f6, 0.5);
        bg.strokeRoundedRect(0, 0, 320, 200, 8);
        
        // Debug labels
        this.debugLabels = {
            boardAngle: this.add.text(10, 10, 'Board Angle: 0°', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#0ea5e9',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            downhillDiff: this.add.text(10, 30, 'Downhill Diff: 0°', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#10b981',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            alignment: this.add.text(10, 50, 'Alignment: 0%', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#f59e0b',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            speed: this.add.text(10, 70, 'Speed: 0 / 0', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#ec4899',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            carvingAmount: this.add.text(10, 90, 'Carving: 0%', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#f87171',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            feetDistance: this.add.text(10, 110, 'Feet Distance: 0px', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#6366f1',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            leftFootPos: this.add.text(10, 130, 'L Foot: (0, 0)', {
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#3b82f6',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            rightFootPos: this.add.text(10, 150, 'R Foot: (0, 0)', {
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#ef4444',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }),
            friction: this.add.text(10, 170, 'Friction Mult: 0.00', {
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#a78bfa',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            })
        };
        
        this.debugContainer.add([bg, ...Object.values(this.debugLabels)]);
        this.debugContainer.setScrollFactor(0);
    }
    
    /**
     * Update debug info
     */
    updateDebugInfo(debugData) {
        const radToDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);
        
        this.debugLabels.boardAngle.setText(`Board Angle: ${radToDeg(debugData.boardAngle)}°`);
        this.debugLabels.downhillDiff.setText(`Downhill Diff: ${radToDeg(debugData.downhillDiff)}°`);
        this.debugLabels.alignment.setText(`Alignment: ${(debugData.alignment * 100).toFixed(0)}%`);
        this.debugLabels.speed.setText(`Speed: ${debugData.speed.toFixed(1)} / ${debugData.maxSpeed}`);
        this.debugLabels.carvingAmount.setText(`Carving: ${(debugData.carvingAmount * 100).toFixed(0)}%`);
        this.debugLabels.feetDistance.setText(`Feet Distance: ${debugData.feetDistance.toFixed(0)}px`);
        this.debugLabels.leftFootPos.setText(`L Foot: (${debugData.leftFoot.x.toFixed(0)}, ${debugData.leftFoot.y.toFixed(0)})`);
        this.debugLabels.rightFootPos.setText(`R Foot: (${debugData.rightFoot.x.toFixed(0)}, ${debugData.rightFoot.y.toFixed(0)})`);
        this.debugLabels.friction.setText(`Friction Mult: ${debugData.frictionMultiplier.toFixed(2)}`);
    }
    
    /**
     * Create controls hint
     */
    createControlsHint() {
        const bounds = this.getUIBounds();
        const centerX = bounds.centerX;
        const y = bounds.bottom - 80;
        
        this.controlsContainer = this.add.container(centerX, y);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRoundedRect(-180, -40, 360, 80, 10);
        
        // Text
        const text1 = this.add.text(0, -20, 'WASD - Left Foot  |  Arrow Keys - Right Foot', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const text2 = this.add.text(0, 5, 'Carve to control speed and direction', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '12px',
            color: '#cbd5e1'
        }).setOrigin(0.5);
        
        this.controlsContainer.add([bg, text1, text2]);
        this.controlsContainer.setScrollFactor(0);
        
        // Fade out after 5 seconds
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: this.controlsContainer,
                alpha: 0,
                duration: 1000
            });
        });
    }
    
    /**
     * Create game over screen
     */
    createGameOverScreen() {
        const bounds = this.getUIBounds();
        const centerX = bounds.centerX;
        const centerY = bounds.centerY;
        
        this.gameOverContainer = this.add.container(centerX, centerY);
        
        // Dark overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(-5000, -5000, 10000, 10000); // Large enough for any screen
        
        // Box
        const box = this.add.graphics();
        box.fillStyle(0xffffff, 0.95);
        box.fillRoundedRect(-250, -180, 500, 360, 15);
        box.lineStyle(4, 0x1e3a8a);
        box.strokeRoundedRect(-250, -180, 500, 360, 15);
        
        // Title
        this.gameOverTitle = this.add.text(0, -120, 'WIPEOUT!', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '42px',
            color: '#dc2626',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Reason
        this.gameOverReason = this.add.text(0, -60, '', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '18px',
            color: '#1e3a8a'
        }).setOrigin(0.5);
        
        // Final score
        this.finalScoreText = this.add.text(0, 0, 'Final Score: 0', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '32px',
            color: '#1e3a8a',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Restart hint
        const restartText = this.add.text(0, 80, 'Press SPACE to restart', {
            fontFamily: C.UI_FONT_FAMILY,
            fontSize: '18px',
            color: '#64748b'
        }).setOrigin(0.5);
        
        // Animated "Press Space" blink
        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        this.gameOverContainer.add([
            overlay,
            box,
            this.gameOverTitle,
            this.gameOverReason,
            this.finalScoreText,
            restartText
        ]);
        
        this.gameOverContainer.setScrollFactor(0);
        this.gameOverContainer.setVisible(false);
    }
    
    /**
     * Handle window resize
     */
    handleResize(gameSize) {
        // Reposition UI elements
        const bounds = this.getUIBounds();
        
        // Update header
        if (this.titleText) {
            this.titleText.setPosition(bounds.left, bounds.top);
            this.scoreText.setPosition(bounds.left, bounds.top + 40);
            this.carvingText.setPosition(bounds.left, bounds.top + 70);
        }
        
        // Update speed bar
        if (this.speedBarBg) {
            const width = 200;
            this.speedBarX = bounds.right - width;
            this.speedBarY = bounds.top;
            this.speedBarBg.clear();
            this.speedBarBg.fillStyle(0x000000, 0.3);
            this.speedBarBg.fillRoundedRect(this.speedBarX, this.speedBarY, width, 30, 5);
            this.speedBarBg.lineStyle(2, 0x1e3a8a, 0.6);
            this.speedBarBg.strokeRoundedRect(this.speedBarX, this.speedBarY, width, 30, 5);
            
            this.speedLabel.setPosition(this.speedBarX + width / 2, this.speedBarY - 25);
        }
        
        // Update controls hint
        if (this.controlsContainer) {
            this.controlsContainer.setPosition(bounds.centerX, bounds.bottom - 80);
        }
        
        // Update game over screen
        if (this.gameOverContainer) {
            this.gameOverContainer.setPosition(bounds.centerX, bounds.centerY);
        }
    }
    
    /**
     * Update score display
     */
    updateScore(score) {
        this.scoreText.setText(`Score: ${score}`);
    }
    
    /**
     * Update speed indicator
     */
    updateSpeed(speedPercent) {
        this.speedBar.clear();
        
        // Color gradient based on speed
        let color = 0x22c55e; // Green (slow)
        if (speedPercent > 0.7) {
            color = 0xef4444; // Red (fast)
        } else if (speedPercent > 0.4) {
            color = 0xf59e0b; // Orange (medium)
        }
        
        this.speedBar.fillStyle(color, 0.8);
        this.speedBar.fillRoundedRect(
            this.speedBarX + 4,
            this.speedBarY + 4,
            (this.speedBarWidth - 8) * speedPercent,
            this.speedBarHeight - 8,
            3
        );
    }
    
    /**
     * Update carving indicator
     */
    updateCarving(carvingAmount) {
        if (carvingAmount > 0.5) {
            this.carvingText.setText('⚡ CARVING! +BONUS');
            this.carvingText.setVisible(true);
        } else {
            this.carvingText.setVisible(false);
        }
    }
    
    /**
     * Show game over screen
     */
    showGameOver(data) {
        this.finalScoreText.setText(`Final Score: ${data.score}`);
        this.gameOverReason.setText(data.reason);
        this.gameOverContainer.setVisible(true);
        
        // Fade in
        this.gameOverContainer.setAlpha(0);
        this.tweens.add({
            targets: this.gameOverContainer,
            alpha: 1,
            duration: 500
        });
    }
    
    /**
     * Hide game over screen
     */
    hideGameOver() {
        this.gameOverContainer.setVisible(false);
        
        // Show controls hint again
        this.controlsContainer.setAlpha(1);
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: this.controlsContainer,
                alpha: 0,
                duration: 1000
            });
        });
    }
}
