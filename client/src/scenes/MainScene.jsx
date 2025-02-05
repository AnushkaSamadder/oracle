import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.npc = null;
    // Default static questions - these will be replaced by dynamic questions if fetched successfully
    // Question pool will store all available questions
    this.questionPool = [];
    // Default questions as fallback
    this.defaultQuestions = {
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
    // Map to store current NPC-question assignments
    this.npcDialogues = { ...this.defaultQuestions };
    this.lastNpcKey = null;
    this.onPlayerAnswer = null;
    this.npcTypes = []; // Will be set in create()
  }

  preload() {
    // ... existing preload code ...
  }

  create() {
    const width = this.game.config.width;
    const height = this.game.config.height;

    const bg = this.add.video(width / 2, height / 2, 'shopBg');
    bg.setOrigin(0.5);
    bg.setDepth(0);
    bg.play(true);

    bg.on('playing', () => {
      const video = bg.video;
      if (video && video.videoWidth && video.videoHeight) {
        const scaleX = width / video.videoWidth;
        const scaleY = height / video.videoHeight;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);
      } else {
        bg.setDisplaySize(width, height);
      }
    });

    const npcTypes = [
      'gatherer', 'graveDigger', 'hunter', 'king', 'knight',
      'knightHorse', 'lumberjack', 'merchant', 'miner', 'nun', 'wanderer'
    ];

    // Create animations for each NPC type (both walk and idle)
    npcTypes.forEach((npcKey) => {
      if (!this.anims.exists(`${npcKey}-walk`)) {
        this.anims.create({
          key: `${npcKey}-walk`,
          frames: Array.from({ length: 11 }, (_, i) => ({ 
            key: `${npcKey}-walk/frame_${i.toString().padStart(2, '0')}_delay-0.1s` 
          })),
          frameRate: 10,
          repeat: -1
        });
      }
      if (!this.anims.exists(`${npcKey}-idle`)) {
        this.anims.create({
          key: `${npcKey}-idle`,
          frames: Array.from({ length: 7 }, (_, i) => ({ 
            key: `${npcKey}-idle/frame_${i}_delay-0.1s` 
          })),
          frameRate: 10,
          repeat: -1
        });
      }
    });

    this.npcTypes = npcTypes;
    window.mainScene = this;
    window.mainSceneEvents = this.events;
    
    // Show a loading text while fetching dynamic questions from the backend
    const loadingText = this.add.text(width / 2, height / 2, "Generating questions...", {
      font: "20px Arial",
      fill: "#ffffff"
    }).setOrigin(0.5);

    // Fetch dynamic questions then spawn NPCs
    this.loadQuestions().then(() => {
      loadingText.destroy();
      this.spawnNextNPC();
    }).catch((err) => {
      console.error("Error loading questions, using default dialogues:", err);
      loadingText.destroy();
      this.spawnNextNPC();
    });
  }

  // Method to fetch dynamic questions from the backend
  async loadQuestions() {
    // Request double the number of questions we need to have a good pool
    const requestCount = this.npcTypes.length * 2;
    const url = `http://localhost:5000/generate-questions?count=${requestCount}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        // Reset the question pool with new questions
        this.questionPool = [...data.questions];
        console.log("New question pool loaded:", this.questionPool);
      } else {
        throw new Error("No valid questions returned from API");
      }
    } catch (error) {
      console.error("Error fetching dynamic questions:", error);
      // If an error occurs, the default static dialogues remain
    }
  }

  spawnNextNPC() {
    let npcKey;
    do {
      npcKey = Phaser.Math.RND.pick(this.npcTypes);
    } while (this.lastNpcKey === npcKey && this.npcTypes.length > 1);
    
    this.lastNpcKey = npcKey;
    const idleKey = `${npcKey}-idle/frame_0_delay-0.1s`;
    const walkKey = `${npcKey}-walk/frame_00_delay-0.1s`;
    
    if (!this.textures.exists(idleKey) || !this.textures.exists(walkKey)) {
      console.log(`idleKey: ${idleKey}, walkKey: ${walkKey}`);
      console.log(`Available textures:`, this.textures.list);
      console.error(`Required textures not found for ${npcKey}`);
      this.time.delayedCall(1000, () => this.spawnNextNPC());
      return;
    }
    
    this.npc = this.add.sprite(2200, 800, idleKey);
    this.npc.setScale(4.5);
    this.npc.setDepth(2);
    this.npc.setAlpha(0);
    
    this.tweens.add({
      targets: this.npc,
      alpha: 1,
      duration: 1000,
      ease: 'Linear'
    });
    
    try {
      this.npc.play(`${npcKey}-walk`);
      this.npc.setFlipX(true);
    } catch (error) {
      console.error(`Error playing animation for ${npcKey}:`, error);
      this.npc.destroy();
      this.time.delayedCall(1000, () => this.spawnNextNPC());
      return;
    }
    
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: this.npc,
        x: 550,
        duration: 4000,
        ease: 'Linear',
        onComplete: () => {
          this.npc.play(`${npcKey}-idle`);
          if (window.dialogueCallbacks?.onShowDialogue) {
            // Get a random question from the pool
            let question;
            if (this.questionPool.length > 0) {
              // Get random index
              const randomIndex = Math.floor(Math.random() * this.questionPool.length);
              // Remove and get the question
              question = this.questionPool.splice(randomIndex, 1)[0];
              // Update the NPC's dialogue
              this.npcDialogues[npcKey] = question;
            } else {
              // If pool is empty, fetch new questions
              console.log("Question pool empty, fetching new questions...");
              this.loadQuestions().catch(err => {
                console.error("Error reloading questions:", err);
                // Use default question as fallback
                question = this.defaultQuestions[npcKey];
              });
              question = this.defaultQuestions[npcKey]; // Use default while loading
            }
            window.dialogueCallbacks.onShowDialogue(question);
          }
          this.onPlayerAnswer = (answer) => {
            if (window.dialogueCallbacks?.onHideDialogue) {
              window.dialogueCallbacks.onHideDialogue();
            }
            this.npc.setFlipX(false);
            this.npc.play(`${npcKey}-walk`);
            this.tweens.add({
              targets: this.npc,
              x: 2200,
              duration: 4000,
              ease: 'Linear',
              onComplete: () => {
                this.npc.destroy();
                this.time.delayedCall(1000, () => this.spawnNextNPC());
              }
            });
          };
        }
      });
    });
  }

  // ... any additional methods or code ...
}
