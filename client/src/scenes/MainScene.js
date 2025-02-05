import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.npc = null;
  }

  preload() {
    // Load the video background
    this.load.video('shopBg', import.meta.env.BASE_URL + 'assets/background.mp4');
    
    // Load NPC frames
    for (let i = 0; i <= 6; i++) {
      this.load.image(
        `idle_${i}`,
        import.meta.env.BASE_URL + `assets/npcs/gatherer/gatherer-idle-frames/frame_${i}_delay-0.1s.png`
      );
    }

    for (let i = 0; i <= 10; i++) {
      const frameNum = i.toString().padStart(2, '0');
      this.load.image(
        `walk_${i}`,
        import.meta.env.BASE_URL + `assets/npcs/gatherer/gatherer-walk-frames/frame_${frameNum}_delay-0.1s.png`
      );
    }
  }

  create() {
    // Create and play the looping video
    const bg = this.add.video(960, 540, 'shopBg');
    bg.play(true);

    // Create NPC sprite
    this.npc = this.add.sprite(1800, 800, 'idle_0');
    this.npc.setScale(4.5);
    this.npc.setDepth(2);
    
    // Create animations
    this.anims.create({
      key: 'idle',
      frames: [
        { key: 'idle_0' },
        { key: 'idle_1' },
        { key: 'idle_2' },
        { key: 'idle_3' },
        { key: 'idle_4' },
        { key: 'idle_5' },
        { key: 'idle_6' }
      ],
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'walk',
      frames: Array.from({ length: 11 }, (_, i) => ({ key: `walk_${i}` })),
      frameRate: 10,
      repeat: -1
    });

    // Start with sprite invisible
    this.npc.setAlpha(0);
    
    // Start the sequence
    this.startNPCSequence();
  }

  startNPCSequence() {
    // Fade in and start walking
    this.tweens.add({
      targets: this.npc,
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        this.npc.play('walk');
        this.npc.setFlipX(true);
        
        this.tweens.add({
          targets: this.npc,
          x: 550,
          duration: 4000,
          ease: 'Linear',
          onComplete: () => {
            this.npc.play('idle');
          }
        });
      }
    });
  }

  update() {
    // No update logic needed as everything is handled by tweens and animations
  }
}
