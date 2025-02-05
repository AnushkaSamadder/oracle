import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.npc = null;
    this.npcDialogues = {};
    this.lastNpcKey = null; // Initialize lastNpcKey here
  }

  preload() {
    // Load the video background
    this.load.video('shopBg', import.meta.env.BASE_URL + 'assets/background.mp4');

    this.load.on('loaderror', (fileObj) => {
      console.error('Error loading asset:', fileObj.src);
    });

    // Add a loading complete handler
    this.load.on('complete', () => {
      console.log('All assets loaded successfully');
    });

    // Define NPC types using the actual character names from the assets folder
    const npcTypes = [
      'gatherer',
      'graveDigger',
      'hunter',
      'king',
      'knight',
      'knightHorse',
      'lumberjack',
      'merchant',
      'miner',
      'nun',
      'wanderer'
    ];

    // Load assets for each NPC using the correct folder structure
    npcTypes.forEach((npc) => {
      // Load idle frames
      for (let i = 0; i <= 6; i++) {
        this.load.image(
          `${npc}_idle_${i}`,
          import.meta.env.BASE_URL + `assets/npcs/${npc}/${npc}-idle/frame_${i}_delay-0.1s.png`
        );
      }
      // Load walk frames
      for (let i = 0; i <= 10; i++) {
        const frameNum = i.toString().padStart(2, '0');
        this.load.image(
          `${npc}_walk_${i}`,
          import.meta.env.BASE_URL + `assets/npcs/${npc}/${npc}-walk/frame_${frameNum}_delay-0.1s.png`
        );
      }
    });
  }

  create() {
    // Create and play the looping video background
    const bg = this.add.video(960, 540, 'shopBg');
    bg.play(true);

    // Create animations for all NPCs upfront
    const npcTypes = [
      'gatherer',
      'graveDigger',
      'hunter',
      'king',
      'knight',
      'knightHorse',
      'lumberjack',
      'merchant',
      'miner',
      'nun',
      'wanderer'
    ];

    npcTypes.forEach((npcKey) => {
      try {
        if (!this.anims.exists(`${npcKey}_walk`)) {
          this.anims.create({
            key: `${npcKey}_walk`,
            frames: Array.from({ length: 11 }, (_, i) => ({ key: `${npcKey}_walk_${i}` })),
            frameRate: 10,
            repeat: -1
          });
        }
        if (!this.anims.exists(`${npcKey}_idle`)) {
          this.anims.create({
            key: `${npcKey}_idle`,
            frames: Array.from({ length: 7 }, (_, i) => ({ key: `${npcKey}_idle_${i}` })),
            frameRate: 10,
            repeat: -1
          });
        }
      } catch (error) {
        console.error(`Error creating animations for ${npcKey}:`, error);
      }
    });

    // Prepare our NPC dialogues with character-appropriate questions
    this.npcDialogues = {
      gatherer: "How fixeth a frozen crystal ball?",
      graveDigger: "What dark arts revive a dead battery?",
      hunter: "How doth one track the elusive wireless signal?",
      king: "Wherefore doth mine royal email refuse to send?",
      knight: "How might one vanquish the dreaded blue screen of death?",
      knightHorse: "What sorcery makes mine steed's GPS falter?",
      lumberjack: "How sharpeneth one the edges of pixelated images?",
      merchant: "Wherefore do mine online transactions fail?",
      miner: "What pickaxe best mines cryptocurrency?",
      nun: "How doth one purify a virus-infected device?",
      wanderer: "Which path leads through the maze of pop-up windows?"
    };

    // Save available NPC types for random selection and avoid repeats.
    this.npcTypes = npcTypes;

    // Expose this scene globally so that React components can access its events.
    window.mainScene = this;

    // Start the first NPC.
    this.spawnNextNPC();
  }

  // Spawns the next NPC using random selection.
  spawnNextNPC() {
    // Randomly select an NPC type, avoiding a repeat of the last one (if possible)
    let npcKey;
    do {
      npcKey = Phaser.Math.RND.pick(this.npcTypes);
    } while (this.lastNpcKey === npcKey && this.npcTypes.length > 1);
    this.lastNpcKey = npcKey;

    // Check that both idle and walk assets exist before creating the sprite
    const idleKey = `${npcKey}_idle_0`;
    const walkKey = `${npcKey}_walk_0`;
    if (!this.textures.exists(idleKey) || !this.textures.exists(walkKey)) {
      console.error(`Required textures not found for ${npcKey}. Idle: ${this.textures.exists(idleKey)}, Walk: ${this.textures.exists(walkKey)}`);
      // Try spawning a different NPC instead of just returning
      this.time.delayedCall(1000, () => {
        this.spawnNextNPC();
      });
      return;
    }

    // Create the NPC sprite off-screen (to the right)
    this.npc = this.add.sprite(2200, 800, idleKey);
    this.npc.setScale(4.5);
    this.npc.setDepth(2);

    // Ensure both walk and idle animations exist (they should have been created in create())
    if (!this.anims.exists(`${npcKey}_walk`)) {
      this.anims.create({
        key: `${npcKey}_walk`,
        frames: Array.from({ length: 11 }, (_, i) => ({ key: `${npcKey}_walk_${i}` })),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists(`${npcKey}_idle`)) {
      this.anims.create({
        key: `${npcKey}_idle`,
        frames: Array.from({ length: 7 }, (_, i) => ({ key: `${npcKey}_idle_${i}` })),
        frameRate: 10,
        repeat: -1
      });
    }

    try {
      // Start by playing the walk animation and facing toward the counter.
      this.npc.play(`${npcKey}_walk`);
      this.npc.setFlipX(true);
    } catch (error) {
      console.error(`Error playing animation for ${npcKey}:`, error);
      this.npc.destroy();
      this.time.delayedCall(1000, () => {
        this.spawnNextNPC();
      });
      return;
    }

    // Tween for NPC entrance: Tween from off-screen at x=2200 to the counter at x=550.
    this.tweens.add({
      targets: this.npc,
      x: 550,
      duration: 4000,
      ease: 'Linear',
      onCompleteScope: this,
      onComplete: () => {
        // Once arrived, switch to idle animation.
        this.npc.play(`${npcKey}_idle`);

        // Show NPC dialogue by emitting an event.
        const question = this.npcDialogues[npcKey];
        console.log('Emitting showDialogue event with question:', question);
        this.events.emit('showDialogue', { question });

        // Listen for the player's answer (only once).
        this.events.once('playerAnswer', (answer) => {
          console.log('Received playerAnswer event with answer:', answer);
          this.events.emit('hideDialogue');

          // NPC exits: face right and play the walk animation.
          this.npc.setFlipX(false);
          this.npc.play(`${npcKey}_walk`);

          // Tween for NPC exit: Tween off-screen.
          this.tweens.add({
            targets: this.npc,
            x: 2200,
            duration: 4000,
            ease: 'Linear',
            onCompleteScope: this,
            onComplete: () => {
              this.npc.destroy();
              // Start next NPC after a short delay.
              this.time.delayedCall(1000, () => {
                this.spawnNextNPC();
              });
            }
          });
        });
      }
    });
  }

  // ... existing code in update ...
}
