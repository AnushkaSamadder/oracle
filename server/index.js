require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
// Require the Twilio client library for SMS functionality
let twilio;
try {
  twilio = require('twilio');
} catch (error) {
  console.warn('Warning: Twilio package not available. SMS features will be disabled.');
}
// Require the OpenAI client
const OpenAI = require('openai');
const app = express();
const port = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn('Warning: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required for SMS features');
}

// Initialize Twilio client if credentials are available
const twilioClient = (twilio && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const VERIFIED_PHONE_NUMBER = process.env.VERIFIED_PHONE_NUMBER;

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tlsAllowInvalidCertificates: true 
});

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(process.env.DB_NAME);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

let db;
connectToMongo().then(database => {
  db = database;
});

// Initialize OpenAI client with Nebius configuration
const openai = new OpenAI({
  baseURL: 'https://api.studio.nebius.ai/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
// Added middleware to properly parse Twilio’s URL-encoded POST data
app.use(express.urlencoded({ extended: false }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Basic route to confirm the server is running
app.get('/', (req, res) => {
  res.json({ status: 'Medieval Shop server is running!' });
});

// Twilio SMS endpoint – handles incoming SMS commands and replies with medieval wisdom.
app.post('/sms', async (req, res) => {
  try {
    const smsBody = req.body.Body ? req.body.Body.trim().toUpperCase() : "";
    const fromNumber = req.body.From;
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();

    if (!fromNumber) {
      twiml.message("Alas, we cannot discern thy identity. Please send thy message again.");
    } else {
      const players = db.collection('players');
      let player = await players.findOne({ visitorId: fromNumber });
      if (!player) {
        player = {
          visitorId: fromNumber,
          visitCount: 1,
          answerCount: 0,
          goodAnswerCount: 0,
          currentTitle: "Novice Advisor",
          unlockedTitles: ["Novice Advisor"],
          lastVisit: new Date(),
          createdAt: new Date()
        };
        await players.insertOne(player);
      } else {
        await players.updateOne(
          { visitorId: fromNumber },
          { $inc: { visitCount: 1 }, $set: { lastVisit: new Date() } }
        );
      }

      if (smsBody === "WISDOM") {
        const wisdomResponses = [
          "🎭 Hints for the Wise 📜\n\n" +
          "1. Use 'thee', 'thou', and 'thy' for authentic medieval speech\n" +
          "2. Begin answers with 'Verily' or 'Forsooth' for extra flair\n" +
          "3. End with phrases like 'indeed' or 'methinks'\n" +
          "4. Reference medieval items: scrolls, potions, or enchantments\n" +
          "5. Add 'eth' or 'st' to verbs: 'speaketh', 'dost'",

          "🏰 Secret Counsel 🗝️\n\n" +
          "• Modern problems need medieval solutions!\n" +
          "• Compare modern tech to magical items\n" +
          "• Speak of computers as 'enchanted boxes'\n" +
          "• Call emails 'messenger ravens'\n" +
          "• Refer to the internet as 'the great ethereal web'",

          "⚔️ Advanced Techniques 📚\n\n" +
          "• Compare bugs to curses or hexes\n" +
          "• Speak of updates as 'enchantments'\n" +
          "• Call passwords 'magical incantations'\n" +
          "• Refer to backups as 'mystic scrolls'\n" +
          "• Describe viruses as 'dark sorcery'"
        ];
        const randomIndex = Math.floor(Math.random() * wisdomResponses.length);
        twiml.message(wisdomResponses[randomIndex]);
      } else if (smsBody === "SCROLL") {
        let summaryMessage = "";
        let score = 0;
        if (player.answerCount > 0) {
          score = Math.round((player.goodAnswerCount / player.answerCount) * 10);
        }
        if (player.answerCount === 0) {
          summaryMessage = "Thy journey hath just begun. No wisdom yet recorded, noble traveler.";
        } else if (score >= 8) {
          summaryMessage = `Thy score: ${score}/10. The peasants sing thy praises! Visit anew, noble wordsmith.`;
        } else if (score >= 5) {
          summaryMessage = `Thy score: ${score}/10. Thy counsel may yet ascend; practice thy art, brave soul.`;
        } else {
          summaryMessage = `Thy score: ${score}/10. Alas, thy wisdom is as murky as a bog. Redeem thyself and return.`;
        }
        twiml.message(summaryMessage);
      } else {
        twiml.message("Greetings, noble traveler! Text 'WISDOM' for gameplay hints and medieval speech tips, or 'SCROLL' for thy session summary.");
      }
    }
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (error) {
    console.error("Error handling SMS webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Evaluation endpoint for medieval answer grading using Nebius AI
app.post('/evaluate', async (req, res) => {
  try {
    const { question, answer } = req.body;
    const visitorId = req.headers['x-visitor-id'] || 'unknown';
    
    // Log visitor interaction (for now)
    console.log(`Visitor ${visitorId} submitted answer:`, { question, answer });
    
    // Input validation
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Question and answer are required fields and cannot be empty.'
      });
    }

    // Validate API key
    if (!process.env.NEBIUS_API_KEY) {
      throw new Error('NEBIUS_API_KEY environment variable is not set');
    }

    // Build the evaluation payload
    const payload = {
      model: "deepseek-ai/DeepSeek-V3",
      max_tokens: 512,
      temperature: 0.3,
      top_p: 0.95,
      messages: [
        {
          role: "system",
          content: `You are evaluating medieval-style answers to questions. Provide a concise evaluation with:
1. A score (0-100)
2. Brief feedback (2-3 sentences max)
3. A specific suggestion for improvement

The answers can be funny and humorous or outlandish (unethical as well, do not reduce grade because of this but it must relate to the question.)

Format your response exactly like this example:
Tally(this is score): 85
Judgment(this is feedback): Strong use of medieval language and creative metaphors. The advice about "slay thy lord" cleverly addresses taking over as a lord.
Plea (this is suggesstion): Consider adding more thee/thou pronouns and medieval expressions like "verily" or "forsooth".

IMPORTANT: Your entire response must follow this exact format. Do not add any other text.`
        },
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}`
        }
      ]
    };

    // Make the API call
    const responseFromAI = await openai.chat.completions.create(payload);
    const feedback = responseFromAI.choices[0]?.message?.content;
    
    // Update player stats if we have a valid visitorId
    if (visitorId !== 'unknown') {
      const players = db.collection('players');
      const scoreMatch = feedback.match(/Tally:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      
      const updateData = {
        $inc: { answerCount: 1 },
        $set: { lastVisit: new Date() }
      };
      
      // Count good answers (score >= 65)
      if (score >= 65) {
        updateData.$inc.goodAnswerCount = 1;
      }
      
      // Check for title upgrades
      const player = await players.findOne({ visitorId });
      if (player) {
        if (player.goodAnswerCount >= 25 && !player.unlockedTitles.includes("Royal Counselor")) {
          updateData.$push = { unlockedTitles: "Royal Counselor" };
          updateData.$set.currentTitle = "Royal Counselor";
        } else if (player.goodAnswerCount >= 10 && !player.unlockedTitles.includes("Village Sage")) {
          updateData.$push = { unlockedTitles: "Village Sage" };
          updateData.$set.currentTitle = "Village Sage";
        }
        
        await players.updateOne({ visitorId }, updateData);

        // After updating, check if we should send an SMS update (every 5 questions)
        const newAnswerCount = (player.answerCount || 0) + 1;
        if (newAnswerCount % 5 === 0 && twilioClient) {
          try {
            const updatedPlayer = await players.findOne({ visitorId });
            const totalScore = Math.round((updatedPlayer.goodAnswerCount / updatedPlayer.answerCount) * 10);
            let message = `🎭 Milestone Report - Question ${newAnswerCount} 📜\n\n`;
            message += `Thy current standing:\n`;
            message += `✨ Title: ${updatedPlayer.currentTitle}\n`;
            message += `📊 Tally: ${totalScore}/10\n`;
            message += `🎯 Successful Counsels: ${updatedPlayer.goodAnswerCount}/${updatedPlayer.answerCount}\n\n`;
            
            if (totalScore >= 8) {
              message += "The kingdom prospers under thy sage advice! 👑";
            } else if (totalScore >= 5) {
              message += "Thy wisdom grows with each passing moon. 🌙";
            } else {
              message += "Keep studying the ancient scrolls, young advisor. 📚";
            }

            await twilioClient.messages.create({
              body: message,
              to: VERIFIED_PHONE_NUMBER,
              from: '+13373585199'
            });
          } catch (smsError) {
            console.error('Error sending milestone SMS:', smsError);
          }
        }
      }
    }
    
    return res.json({
      feedback,
      status: 'success'
    });
  } catch (error) {
    console.error("Error in /evaluate endpoint:", error);
    
    // Determine appropriate error status
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || "Internal server error";
    
    return res.status(status).json({ 
      error: 'Evaluation Failed',
      message,
      status: 'error'
    });
  }
});

// Generate medieval questions using meta llama
app.get('/generate-questions', async (req, res) => {
  try {
    // Validate API key
    if (!process.env.NEBIUS_API_KEY) {
      throw new Error('NEBIUS_API_KEY environment variable is not set');
    }

    const count = parseInt(req.query.count) || 1; // Number of questions to generate
    
    const payload = {
      model: "meta-llama/Llama-3.3-70B-Instruct",
      max_tokens: 512,
      temperature: 0.5,
      top_p: 0.9,
      extra_body: {
        top_k: 50
      },
      messages: [
        {
          role: "system",
          content: `You must respond with a JSON array containing exactly ${count} medieval-style questions. Format your entire response as a single JSON array like this example: ["How doth one catch a ghost?", "Why doth mine cow give sour milk?"] Do not include any other text, markdown, or formatting - just the JSON array. The questions should be medieval-style inquiries that: 1. Use archaic language (thee, thou, thy, dost) 2. Mix modern concepts with medieval perspectives 3. Be humorous or quirky 4. Relate to daily medieval life or supernatural concerns Example themes: - Love and relationships - Supernatural occurrences - Personal troubles - Kingdom matters - Health and wealth - Odd situations Example questions: 1. "Will my ship reach its destination?" 2. "Will I finish my expedition?" 3. "Can I trust my servant?" 4. "How will 2 gold be worth tomorrow?" 5. "When will the king die?" 6. "Who will be the next king?" 7. "How can I become king?" 8. "How to join the king's guard?" 9. "Can lowfolk marry the princess?" 10. "How can I become a knight without a horse?" 11. "Dost thou think my lord's beard doth attract too many flies?" 12. "Can a peasant dream of marrying a noblewoman?" 13. "How doth one rid the barn of a stubborn mule?" 14. "Where should I hide mine treasure from the tax collectors?" 15. "Will mine crops grow taller if I sing to them?" 16. "What should I do if my wife doth believe in witches?" 17. "How can I ensure my ale flows more smoothly at the tavern?" 18. "What manner of magic can stop mine neighbour's chickens from crowing at dawn?" 19. "Dost thou think mine enemy can read my thoughts?" 20. "How can one tell if a potion is truly cursed?" 21. "Where must I bury a treasure so the thieves shall never find it?" 22. "What should I do if mine servant turns out to be a goblin?" 23. "Can a man marry twice if his first wife hath run off?" 24. "How doth one know if a fairy hath cursed my cow?" 25. "Can a king decree that all must wear hats of gold?" 26. "What should I do if my best sword breaks in battle?" 27. "Can I trust a merchant who smells of garlic?" 28. "How doth one become the royal jester?" 29. "How can I become the next lord of the manor?" 30. "Can lowfolk marry the princess if they bring enough gifts?" 31. "What should I do if the local wizard doth not return mine cloak?" 32. "How can I win favor with the king's court without riches?" 33. "Can a sorcerer be trusted to cure my warts?" 34. "Where might I find a dragon's scale to make a fine cloak?" 35. "How can one tell if a person is truly under a spell?" 36. "What wouldst thou advise if the village is plagued by wild boars?" 37. "Should I tell mine wife I ate the last of the bread?" 38. "How doth one tell if a man is truly a nobleman or just a swindler?" 39. "What dost one do if one's horse refuses to race?" 40. "Can a man change his fate by calling upon the stars?" 41. "How dost thou find the lost key to the castle gates?" 42. "What should I say to a nobleman who speaks only of his gold?" 43. "How do I stop mine dog from chasing the mailman?" 44. "Where might one buy a magic mirror that shows the future?" 45. "How can I ensure mine wine never spoils?" 46. "What should I do if the town crier speaks falsely?" 47. "Is it wrong to challenge the blacksmith to a duel over a broken plow?" Remember: Your entire response must be a valid JSON array of strings. Do not include any other text.`
        }
      ]
    };

    const response = await openai.chat.completions.create(payload);
    
    // Parse and validate the response
    let questions = [];
    try {
      const content = response.choices[0]?.message?.content;
      console.log("Raw AI response:", content); // Debug log
      
      // Clean up the content to ensure it's valid JSON
      let cleanContent = content.trim();
      
      // Log the raw content for debugging
      console.log('Raw content from AI:', cleanContent);

      // If the content is just repeated "Question", return fallback questions
      if (cleanContent.split('Question').length > 10) {
        console.log('Detected repeated Question pattern, using fallback');
        return res.json({
          questions: [
            "How doth one become a royal lord?",
            "What ancient wisdom might cure death?",
            "What must one do to acquire the throne?",
            "How might one send a message faster than by raven?",
            "If I had to silence my wife, where must I bury her remains?"
          ],
          status: 'fallback',
          error: 'AI generated invalid response'
        });
      }

      // Try to extract a JSON array if present
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      // Additional cleanup
      cleanContent = cleanContent
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^\s*\[/, '[')
        .replace(/\]\s*$/, ']')
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ');
      
      try {
        questions = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // If JSON parse fails, try extracting questions from text
        const matches = content.match(/["']([^"']+)["']/g);
        if (matches) {
          questions = matches.map(q => q.replace(/^["']|["']$/g, ''));
          console.log("Extracted questions from text:", questions);
        }
      }

      // Validate questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // Ensure each question is a non-empty string
      questions = questions
        .filter(q => typeof q === 'string' && q.trim().length > 0)
        .map(q => q.trim());

      if (questions.length === 0) {
        throw new Error('No valid questions after filtering');
      }

      return res.json({
        questions,
        status: 'success'
      });
    } catch (error) {
      console.error("Error processing questions:", error);
      // Return whatever questions we managed to extract, or fallback questions
      return res.json({
        questions: questions.length > 0 ? questions : [
          "How doth one catch a wayward email?",
          "What magic potion might cure mine computer's ailments?",
          "Why doth mine smartphone refuse mine touch?"
        ],
        status: questions.length > 0 ? 'success' : 'partial',
        error: questions.length > 0 ? undefined : error.message
      });
    }
  } catch (error) {
    console.error("Error in /generate-questions endpoint:", error);
    return res.status(500).json({ 
      error: 'Question Generation Failed',
      message: error.message,
      status: 'error'
    });
  }
});

// New endpoint to get or create player profile
app.get('/player/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const userAgent = req.headers['user-agent'];
    const players = db.collection('players');
    
    let player = await players.findOne({ visitorId });
    
    if (!player) {
      player = {
        visitorId,
        visitCount: 0,
        answerCount: 0,
        goodAnswerCount: 0,
        currentTitle: "Novice Advisor",
        unlockedTitles: ["Novice Advisor"],
        lastVisit: new Date(),
        createdAt: new Date()
      };
      await players.insertOne(player);
    } else {
      player.visitCount += 1;
      await players.updateOne({ visitorId }, { $set: { visitCount: player.visitCount, lastVisit: new Date() } });
    }

    // Detect browser
    let browser = "unknown";
    if (userAgent.includes("Chrome")) {
      browser = "chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = "firefox";
    } else if (userAgent.includes("Safari")) {
      browser = "safari";
    }

    return res.json({ ...player, browser });
  } catch (error) {
    console.error('Error in player endpoint:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New endpoint for requesting hints
app.post('/request-hints', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!twilioClient) {
      return res.status(503).json({ 
        success: false, 
        message: 'SMS service unavailable' 
      });
    }

    const inspirationalMessages = [
      "🌟 Hark, noble seeker of wisdom! May these ancient secrets guide thy path through the mystical realm of technology. Remember: every master was once a novice, and every sage began with but a single scroll. Press onward with courage, for greatness awaits! 📜✨",
      
      "⚔️ Brave soul! As the knights of old wielded sword and shield, so too must thou master the art of medieval speech. Let these sacred techniques be thy armor in the grand quest for knowledge. Fortune favors the eloquent! 🛡️",
      
      "🏰 Lo and behold, dedicated scholar! Within these mystical words lies the power to transform modern troubles into medieval triumphs. May thy wit grow sharper than a dragon's tooth! 🐉"
    ];

    const randomMessage = inspirationalMessages[Math.floor(Math.random() * inspirationalMessages.length)];

    await twilioClient.messages.create({
      body: randomMessage,
      to: phoneNumber,
      from: '+13373585199'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
