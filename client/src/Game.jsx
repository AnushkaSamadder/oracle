import React, { useEffect } from 'react';
import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import MainScene from './scenes/MainScene';

const Game = () => {
  useEffect(() => {
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.add('loading');
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const config = {
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
        parent: 'game-container',
        zoom: isMobile ? 0.5 : 1
      },
      pixelArt: false,
      backgroundColor: '#2d2d2d',
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
    
    const handleOrientation = () => {
      if (game && game.scale) {
        game.scale.refresh();
      }
    };
    
    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', handleOrientation);

    game.events.once('ready', () => {
      if (container) {
        container.classList.remove('loading');
      }
    });

    return () => { 
      window.removeEventListener('orientationchange', handleOrientation);
      window.removeEventListener('resize', handleOrientation);
      game.destroy(true); 
    };
  }, []);

  return (
    <div id="game-container" style={{
      width: '100vw',
      height: '100vh',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 0
    }}></div>
  );
};

export default Game;
