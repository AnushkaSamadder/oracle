import React, { useEffect } from 'react';
import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import MainScene from './scenes/MainScene';

const Game = () => {
  useEffect(() => {
    // Add loading class
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.add('loading');
    }

    const config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
        parent: 'game-container'
      },
      pixelArt: false,
      backgroundColor: '#2d2d2d', // fallback background if video fails
      clearBeforeRender: true,
      antialiasGL: true,
      dom: {
        createContainer: true
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [Preloader, MainScene]
    };

    const game = new Phaser.Game(config);
    // Remove loading class when game is ready
    game.events.once('ready', () => {
      if (container) {
        container.classList.remove('loading');
      }
    });

    return () => { game.destroy(true); };
  }, []);

  return <div id="game-container"></div>;
};

export default Game;
