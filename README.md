# The Oracle's Tavern 🏰

Imagine if ChatGPT or the other LLMs were a thing in medieval times? Well you no longer have to! The Oracle's Tavern is a medieval-themed interactive web application where travelers seek wisdom from mystical patrons in an enchanted tavern. Each character presents unique questions about problems of that time, creating an engaging and humorous experience.

## 🎮 Features

- Interactive medieval shop environment with animated NPCs
- Text-to-speech using ElevenLabs for character voices
- Dynamic question generation using AI
- Medieval-style dialogue system
- Progress tracking and titles
- Mobile-responsive design
- Background music and sound effects
- SMS notifications and hints via Twilio

## 🛠️ Technology Stack

### Frontend
- React
- Phaser.js for game engine
- Vite for build tooling
- FingerprintJS for visitor tracking

### Backend
- Node.js with Express
- MongoDB for data persistence
- ElevenLabs API for voice synthesis
- Nebius AI for question generation
- Twilio for SMS functionality

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- ElevenLabs API key
- Nebius API key
- Twilio account (optional)

### Environment Setup

Create a `.env` file in the server directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name
NEBIUS_API_KEY=your_nebius_api_key
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
VERIFIED_PHONE_NUMBER=your_verified_phone_number
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Start the development servers:

```bash
# Start the backend server
cd server
npm run dev

# In a new terminal, start the frontend
cd client
npm start
```

The application will be available at `http://localhost:5173`

## 🎨 Game Characters

The game features various medieval characters, each with unique animations and voices:
- Hunter
- Grave Digger
- King
- Knight
- Knight on Horse
- Lumberjack
- Merchant
- Miner
- Nun
- Wanderer

## 🎵 Audio

The game includes:
- Background medieval music
- Character-specific sound effects and voices
- Various interaction sounds

## 📱 Mobile Support

The game is responsive and supports mobile devices with:
- Touch controls
- Scaled interface
- Orientation handling

## 👑 Player Progression

Players can earn titles based on their performance:
- Novice Advisor
- Village Sage
- Royal Counselor

## 📞 SMS Features

- Receive medieval-style hints
- Get progress updates
- Milestone notifications

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Medieval character assets
- Sound effects and music
- Font providers
- API service providers: Elevenlabs, Nebius, Twilio and Fingerprint
