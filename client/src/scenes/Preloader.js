import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Create a progress bar background and bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 25, width / 2, 50);

    const progressBar = this.add.graphics();

    // Show loading text feedback
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading Assets...',
      style: { font: '20px monospace', fill: '#ffffff' }
    });
    loadingText.setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 4 + 10, height / 2 - 15, (width / 2 - 20) * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      // Check if the fallback NPC placeholder texture exists.
      if (!this.textures.exists('npc_placeholder')) {
        // Create a simple red square texture as a fallback.
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 100, 100);
        graphics.generateTexture('npc_placeholder', 100, 100);
        graphics.destroy();
        console.warn('npc_placeholder texture created as fallback.');
      }
      console.log('All assets loaded successfully');
    });

    this.load.on('loaderror', (file) => {
      console.error('Error loading asset:', file.key, file.src);
    });

    // Load background video from the public folder (using an absolute path)
    this.load.video('shopBg', '/assets/background.mp4', 'loadeddata', false, true);

    // Load fallback NPC image
    this.load.image('npc_placeholder', '/assets/npc_placeholder.png');

    // Load NPC assets
    const npcTypes = [
      'gatherer', 'graveDigger', 'hunter', 'king', 'knight',
      'knightHorse', 'lumberjack', 'merchant', 'miner', 'nun', 'wanderer'
    ];

    // Dynamic configuration for NPC frame counts
    const npcFrameCounts = {
      gatherer: { idle: 7, walk: 11 },
      graveDigger: { idle: 7, walk: 11 },
      hunter: { idle: 7, walk: 9 },
      king: { idle: 8, walk: 5 },
      knight: { idle: 8, walk: 7 },
      knightHorse: { idle: 9, walk: 11 },
      lumberjack: { idle: 7, walk: 8 },
      merchant: { idle: 7, walk: 12 },
      miner: { idle: 7, walk: 6 },
      nun: { idle: 6, walk: 5 },
      wanderer: { idle: 7, walk: 12 }
    };
    
    npcTypes.forEach((npc) => {
      // Load idle frames using dynamic frame counts
      const idleCount = npcFrameCounts[npc].idle;
      for (let i = 0; i < idleCount; i++) {
        // Try both naming patterns for idle frames
        const idleFrame = `frame_${i}_delay-0.1s.png`;
        const paddedIdleFrame = `frame_${i.toString().padStart(2, '0')}_delay-0.1s.png`;
        
        // Load both variants - Phaser will use whichever exists
        this.load.image(
          `${npc}-idle/frame_${i}_delay-0.1s`,
          `/assets/npcs/${npc}/${npc}-idle/${idleFrame}`
        );
        this.load.image(
          `${npc}-idle/frame_${i.toString().padStart(2, '0')}_delay-0.1s`,
          `/assets/npcs/${npc}/${npc}-idle/${paddedIdleFrame}`
        );
      }
      
      // Load walk frames using dynamic frame counts
      const walkCount = npcFrameCounts[npc].walk;
      for (let i = 0; i < walkCount; i++) {
        // Try both naming patterns for walk frames
        const frameNum = i.toString().padStart(2, '0');
        const walkFrame = `frame_${frameNum}_delay-0.1s.png`;
        const unpaddedWalkFrame = `frame_${i}_delay-0.1s.png`;
        
        // Load both variants - Phaser will use whichever exists
        this.load.image(
          `${npc}-walk/frame_${frameNum}_delay-0.1s`,
          `/assets/npcs/${npc}/${npc}-walk/${walkFrame}`
        );
        this.load.image(
          `${npc}-walk/frame_${i}_delay-0.1s`,
          `/assets/npcs/${npc}/${npc}-walk/${unpaddedWalkFrame}`
        );
      }
    });
  }

  create() {
    // Once assets are loaded, transition to MainScene.
    this.scene.start('MainScene');
  }
}
