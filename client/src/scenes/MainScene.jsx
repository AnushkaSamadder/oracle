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

    // Browser-specific questions
    this.browserSpecificQuestions = {
      "chrome": {
        npcType: "swiftFalcon",
        question: "Mine messenger falcon 'google the 1st' moves swift as lightning, yet devours the kingdom's grain stores! How might one tame its appetite?",
      },
      "firefox": {
        npcType: "flameFox",
        question: "The mystical fire fox guards my scrolls, but why doth it slumber more each moon?",
      },
      "safari": {
        npcType: "mysticalLion",
        question: "The crystal lion's pride grows restless with each passing season. What magic keeps it from wandering?",
      }
    };
    
    // Visit-based NPCs and their questions
    this.visitBasedNPCs = {
      "wanderingScholar": {
        minVisits: 5,
        questions: [
          "How doth one organize countless scrolls within a single tome?",
          "Why do mine enchanted windows multiply like rabbits?",
        ]
      },
      "portalMaster": {
        minVisits: 10,
        questions: [
          "The void between realms fills with forgotten memories - how to cleanse it?",
          "Mine portal remembers too many merchant visits, causing strange visions.",
        ]
      },
      "timeKeeper": {
        minVisits: 20,
        questions: [
          "The sands of time leave tracks in mine crystal - how to sweep them away?",
          "Past visions cloud mine seeing stone - what ritual might clear them?",
        ]
      }
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
    
    // Dynamic configuration for NPC frame counts (must match Preloader.js)
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

    // Reset loadedNpcTypes
    this.loadedNpcTypes = [];
    
    // Create animations for each NPC type.
    npcTypes.forEach((npcKey) => {
      // Build walk frames array using dynamic frame counts.
      let walkFrames = [];
      const walkFrameCount = npcFrameCounts[npcKey].walk;
      for (let i = 0; i < walkFrameCount; i++) {
        // Try both padded and unpadded frame keys
        const paddedKey = `${npcKey}-walk/frame_${i.toString().padStart(2, '0')}_delay-0.1s`;
        const unpaddedKey = `${npcKey}-walk/frame_${i}_delay-0.1s`;
        
        // Use whichever frame exists
        if (this.textures.exists(paddedKey)) {
          walkFrames.push({ key: paddedKey });
        } else if (this.textures.exists(unpaddedKey)) {
          walkFrames.push({ key: unpaddedKey });
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
      
      // Build idle frames array using dynamic frame counts.
      let idleFrames = [];
      const idleFrameCount = npcFrameCounts[npcKey].idle;
      for (let i = 0; i < idleFrameCount; i++) {
        // Try both padded and unpadded frame keys
        const paddedKey = `${npcKey}-idle/frame_${i.toString().padStart(2, '0')}_delay-0.1s`;
        const unpaddedKey = `${npcKey}-idle/frame_${i}_delay-0.1s`;
        
        // Use whichever frame exists
        if (this.textures.exists(paddedKey)) {
          idleFrames.push({ key: paddedKey });
        } else if (this.textures.exists(unpaddedKey)) {
          idleFrames.push({ key: unpaddedKey });
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
      
      // Only add npcKey to loadedNpcTypes if both idle and walk animations loaded correct frames.
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
    const requestCount = this.npcTypes.length * 2;
    const url = `http://localhost:5000/generate-questions?count=${requestCount}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        this.questionPool = [...data.questions];
        console.log("Dynamic question pool loaded:", this.questionPool);
      } else {
        throw new Error("No valid questions returned from API");
      }

      // Fetch player profile to determine rare NPCs
      const visitorId = window.visitorId;
      if (!visitorId) {
        console.warn("No visitor ID available");
        return;
      }

      const profileResponse = await fetch(`http://localhost:5000/player/${visitorId}`);
      const profile = await profileResponse.json();
      const { browser, visitCount } = profile;

      // Add browser-specific question at the beginning
      if (this.browserSpecificQuestions[browser]) {
        const browserNPC = this.browserSpecificQuestions[browser];
        this.questionPool.unshift(browserNPC.question);
        this.npcDialogues[browserNPC.npcType] = browserNPC.question;
        // Add the NPC type to available types if not already present
        if (!this.npcTypes.includes(browserNPC.npcType)) {
          this.npcTypes.push(browserNPC.npcType);
        }
      }

      // Add visit-based questions
      for (const npcKey in this.visitBasedNPCs) {
        if (visitCount >= this.visitBasedNPCs[npcKey].minVisits) {
          this.questionPool.push(...this.visitBasedNPCs[npcKey].questions);
          this.npcDialogues[npcKey] = this.visitBasedNPCs[npcKey].questions[0];
          // Add the NPC type if not already present
          if (!this.npcTypes.includes(npcKey)) {
            this.npcTypes.push(npcKey);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
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
    
    // Try both padded and unpadded frame keys for initial sprite
    const idleUnpadded = `${npcKey}-idle/frame_0_delay-0.1s`;
    const idlePadded = `${npcKey}-idle/frame_00_delay-0.1s`;
    const walkUnpadded = `${npcKey}-walk/frame_0_delay-0.1s`;
    const walkPadded = `${npcKey}-walk/frame_00_delay-0.1s`;
    
    // Use whichever frame exists
    let initialFrame;
    if (this.textures.exists(idleUnpadded)) {
      initialFrame = idleUnpadded;
    } else if (this.textures.exists(idlePadded)) {
      initialFrame = idlePadded;
    } else if (this.textures.exists(walkUnpadded)) {
      initialFrame = walkUnpadded;
    } else if (this.textures.exists(walkPadded)) {
      initialFrame = walkPadded;
    }
    
    if (!initialFrame) {
      console.error(`Required textures not found for ${npcKey}.`);
      // Retry after a short delay.
      this.time.delayedCall(1000, () => this.spawnNextNPC());
      return;
    }
    
    this.npc = this.add.sprite(2200, 800, initialFrame);
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
    
    // Play NPC sound when spawning
    const npcSound = this.sound.add(`${npcKey}-sound`);
    npcSound.play();
    
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: this.npc,
        x: 550,
        duration: 4000,
        ease: 'Linear',
        onComplete: () => {
          this.npc.play(`${npcKey}-idle`);
          if (window.dialogueCallbacks?.onShowDialogue) {
            let question;
            
            // Prioritize question pool, then default questions
            if (this.questionPool && this.questionPool.length > 0) {
              question = this.questionPool.shift();
              this.npcDialogues[npcKey] = question;
            } else {
              // Fallback to default question if pool is empty
              question = this.defaultQuestions[npcKey] || "No question available";
              console.log("Question pool empty, using default question");
            }
            
            window.dialogueCallbacks.onShowDialogue(question, npcKey);
          }
          this.onPlayerAnswer = (answer) => {
            if (window.dialogueCallbacks?.onHideDialogue) {
              window.dialogueCallbacks.onHideDialogue();
            }
            
            // Play coin sound on completion
            const coinSound = this.sound.add('coin');
            coinSound.play();
            
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