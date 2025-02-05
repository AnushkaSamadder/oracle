import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.npc = null;
  }

  preload() {
    // Load the video background using the actual MP4 file in assets
    this.load.video('shopBg', import.meta.env.BASE_URL + 'assets/background .mp4');
    this.load.image('counter', import.meta.env.BASE_URL + 'assets/counter.png');
    this.load.image('player', import.meta.env.BASE_URL + 'assets/player.png');
    this.load.image('npc', import.meta.env.BASE_URL + 'assets/npc.png');
  }

  create() {
    // Create and play the looping video, centered in the larger canvas
    const bg = this.add.video(960, 540, 'shopBg');  // center of 1920x1080
    bg.setDisplaySize(1920, 1080);
    bg.play(true);

    // Create your other game elements here, adjusted for full HD
    this.player = this.physics.add.sprite(480, 750, 'player');  // adjusted x,y positions
    this.player.setDepth(2);
    this.player.setImmovable(true);

    this.npc = this.physics.add.sprite(1440, 750, 'npc');  // adjusted x position
    this.npc.setDepth(2);

    this.physics.add.collider(this.player, this.npc);
  }

  update(time, delta) {
    // Future game logic
  }
}
