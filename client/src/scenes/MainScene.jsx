
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.npc = null;
    // Default fallback questions (used if dynamic questions are not loaded).
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
    // Map to store dynamically loaded questions (or fallback default)
    this.npcDialogues = { ...this.defaultQuestions };
    this.npcTypes = []; // To be set in create()
    // NEW: List of NPCs that loaded animations successfully
    this.loadedNpcTypes = [];
    this.lastNpcKey = null;
    this.onPlayerAnswer = null;
  }


  create() {
    const width = this.game.config.width;
    const height = this.game.config.height;
    
    // Set up background video and scaling (existing code)
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
    
    // Define the full list of NPC types
    const npcTypes = [
      'gatherer', 'graveDigger', 'hunter', 'king', 'knight',
      'knightHorse', 'lumberjack', 'merchant', 'miner', 'nun', 'wanderer'
    ];
    this.npcTypes = npcTypes;
    
    // Reset loadedNpcTypes
    this.loadedNpcTypes = [];
    
    // Create animations for each NPC type.
    npcTypes.forEach((npcKey) => {
      // Build walk frames array by checking if each frame texture exists.
      let walkFrames = [];
      for (let i = 0; i <= 10; i++) {
        const frameKey = `${npcKey}-walk/frame_${i.toString().padStart(2, '0')}_delay-0.1s`;
        if (this.textures.exists(frameKey)) {
          walkFrames.push({ key: frameKey });
        }
      }
      let walkFallbackUsed = false;
      if (walkFrames.length === 0) {
        walkFrames = [{ key: 'npc_placeholder' }];
        walkFallbackUsed = true;
        console.error(`Walk frames missing for ${npcKey}. Using placeholder.`);
      }
      if (!this.anims.exists(`${npcKey}-walk`)) {
        this.anims.create({
          key: `${npcKey}-walk`,
          frames: walkFrames,
          frameRate: 10,
          repeat: -1
        });
      }
      
      // Build idle frames array by checking if each frame texture exists.
      let idleFrames = [];
      for (let i = 0; i <= 6; i++) {
        const frameKey = `${npcKey}-idle/frame_${i}_delay-0.1s`;
        if (this.textures.exists(frameKey)) {
          idleFrames.push({ key: frameKey });
        }
      }
      let idleFallbackUsed = false;
      if (idleFrames.length === 0) {
        idleFrames = [{ key: 'npc_placeholder' }];
        idleFallbackUsed = true;
        console.error(`Idle frames missing for ${npcKey}. Using placeholder.`);
      }
      if (!this.anims.exists(`${npcKey}-idle`)) {
        this.anims.create({
          key: `${npcKey}-idle`,
          frames: idleFrames,
          frameRate: 10,
          repeat: -1
        });
      }
      
      // Only add npcKey to loadedNpcTypes if BOTH idle and walk animations loaded real frames.
      if (!walkFallbackUsed && !idleFallbackUsed) {
        this.loadedNpcTypes.push(npcKey);
        console.log(`NPC "${npcKey}" loaded successfully.`);
      } else {
        console.warn(`NPC "${npcKey}" will be excluded from spawn pool due to missing assets.`);
      }
    });
    
    window.mainScene = this;
    window.mainSceneEvents = this.events;
    
    // Show loading text while dynamic questions are being fetched.
    const loadingText = this.add.text(width / 2, height / 2, "Generating questions...", {
      font: "20px Arial",
      fill: "#ffffff"
    }).setOrigin(0.5);
    
    this.loadQuestions().then(() => {
      loadingText.destroy();
      // Start spawning using the filtered list if available.
      this.spawnNextNPC();
    }).catch((err) => {
      console.error("Error loading questions, using defaults:", err);
      loadingText.destroy();
      this.spawnNextNPC();
    });
  }

  // New method to fetch dynamic questions from the backend.
  async loadQuestions() {
    // Request more questions than the number of NPCs for a good pool.
    const requestCount = this.npcTypes.length * 2;
    const url = `http://localhost:5000/generate-questions?count=${requestCount}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        // Store the questions in a pool for use—later each spawned NPC will take a random question.
        this.questionPool = [...data.questions];
        console.log("Dynamic question pool loaded:", this.questionPool);
      } else {
        throw new Error("No valid questions returned from API");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Fallback: use default questions as pool.
      this.questionPool = Object.values(this.defaultQuestions);
    }
  }

  spawnNextNPC() {
    let availableNpcTypes = this.loadedNpcTypes.length > 0 ? this.loadedNpcTypes : this.npcTypes;
    let npcKey;
    do {
      npcKey = Phaser.Math.RND.pick(availableNpcTypes);
    } while (this.lastNpcKey === npcKey && availableNpcTypes.length > 1);
    
    this.lastNpcKey = npcKey;
    
    const idleKey = `${npcKey}-idle/frame_0_delay-0.1s`;
    const walkKey = `${npcKey}-walk/frame_00_delay-0.1s`;
    
    if (!this.textures.exists(idleKey) || !this.textures.exists(walkKey)) {
      console.error(`Required textures not found for ${npcKey}. Idle: ${idleKey}, Walk: ${walkKey}`);
      // Retry after a short delay.
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
            // Use a random question from the pool and remove it.
            let question;
            if (this.questionPool && this.questionPool.length > 0) {
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
}
