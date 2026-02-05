import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import * as C from './config/constants.js';

/**
 * Carve Drifters - Main Entry Point
 * A dual-foot snowboarding game with POV perspective
 */

const config = {
    type: Phaser.AUTO,
    width: C.GAME_WIDTH,
    height: C.GAME_HEIGHT,
    backgroundColor: C.BACKGROUND_COLOR,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, UIScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    }
};

// Create game instance
const game = new Phaser.Game(config);

// Export for debugging
window.game = game;
