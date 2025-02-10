import React, { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Game from './Game.jsx';
import DialogueBox from './components/DialogueBox.jsx';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

function App() {
  const [visitorId, setVisitorId] = useState(null);
  const [dialogue, setDialogue] = useState({ visible: false, question: '', npcType: '' });
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [newTitle, setNewTitle] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const backgroundMusicRef = useRef(null);
  const [showHints, setShowHints] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsStatus, setSmsStatus] = useState('');

  const browserSpecificQuestions = {
    "chrome": {
      npcType: "swiftFalcon",
      question: "Mine messenger falcon moves swift as lightning, yet devours the kingdom's grain stores! How might one tame its appetite?", // Chrome memory usage
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
  
  const visitBasedNPCs = {
    "wanderingScholar": {
      minVisits: 5,
      questions: [
        "How doth one organize countless scrolls within a single tome?", // browser tabs
        "Why do mine enchanted windows multiply like rabbits?",
      ]
    },
    "portalMaster": {
      minVisits: 10,
      questions: [
        "The void between realms fills with forgotten memories - how to cleanse it?", // cache
        "Mine portal remembers too many merchant visits, causing strange visions.",
      ]
    },
    "timeKeeper": {
      minVisits: 20,
      questions: [
        "The sands of time leave tracks in mine crystal - how to sweep them away?", // history
        "Past visions cloud mine seeing stone - what ritual might clear them?",
      ]
    }
  };

  useEffect(() => {
    const initFingerprintJS = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
        console.log('Visitor ID:', result.visitorId);
        window.visitorId = result.visitorId;
      } catch (error) {
        console.error('Error initializing FingerprintJS:', error);
      }
    };

    initFingerprintJS();
  }, []);

  useEffect(() => {
    if (visitorId) {
      fetch(`http://localhost:5000/player/${visitorId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Player profile:', data);
          setPlayerProfile(data);
        })
        .catch(err => console.error('Error fetching player profile:', err));
    }
  }, [visitorId]);
  
  const onShowDialogue = useCallback((question, npcType) => {
    setDialogue({ visible: true, question, npcType });
    setShowAnswerInput(false);
    setAnalysis("");
    setUserAnswer("");
  }, []);

  const onHideDialogue = useCallback(() => {
    setDialogue({ visible: false, question: '' });
    setShowAnswerInput(false);
    setAnalysis("");
    setUserAnswer("");
  }, []);

  const onSubmitAnswer = useCallback(async (answer) => {
    setEvaluationLoading(true);
    setUserAnswer(answer);
    try {
      const res = await fetch('http://localhost:5000/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Visitor-ID': visitorId || 'unknown'
        },
        body: JSON.stringify({ question: dialogue.question, answer })
      });
      const data = await res.json();
      setAnalysis(data.feedback || "No feedback available.");

      if (visitorId) {
        const profileRes = await fetch(`http://localhost:5000/player/${visitorId}`);
        const newProfile = await profileRes.json();
        
        if (newProfile.currentTitle !== playerProfile?.currentTitle) {
          setNewTitle(newProfile.currentTitle);
          setTimeout(() => setNewTitle(null), 3000);
        }
        
        setPlayerProfile(newProfile);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setAnalysis("Evaluation error occurred.");
    } finally {
      setEvaluationLoading(false);
    }
  }, [dialogue.question, visitorId, playerProfile]);

  const onDismissAnalysis = useCallback(() => {
    if (window.mainScene && typeof window.mainScene.onPlayerAnswer === 'function') {
      window.mainScene.onPlayerAnswer(userAnswer);
    }
    onHideDialogue();
  }, [userAnswer, onHideDialogue]);

  useEffect(() => {
    window.dialogueCallbacks = { onShowDialogue, onHideDialogue };
    return () => {
      window.dialogueCallbacks = null;
    };
  }, [onShowDialogue, onHideDialogue]);

  useEffect(() => {
    try {
      backgroundMusicRef.current = new Audio('/assets/audio/music/background.mp3');
      backgroundMusicRef.current.loop = true;
      
      // Add error handling for audio loading
      backgroundMusicRef.current.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
      });

      // Add successful load handler and autoplay
      backgroundMusicRef.current.addEventListener('canplaythrough', () => {
        console.log('Background music loaded successfully');
        // Attempt to autoplay
        const playPromise = backgroundMusicRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsMusicPlaying(true);
            })
            .catch(error => {
              console.error("Autoplay prevented:", error);
              setIsMusicPlaying(false);
            });
        }
      });
    } catch (error) {
      console.error('Error initializing background music:', error);
    }
    
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (backgroundMusicRef.current) {
      try {
        if (isMusicPlaying) {
          backgroundMusicRef.current.pause();
        } else {
          const playPromise = backgroundMusicRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Error playing background music:", error);
            });
          }
        }
        setIsMusicPlaying(!isMusicPlaying);
      } catch (error) {
        console.error('Error toggling music:', error);
      }
    }
  };

  const requestHintSMS = async () => {
    try {
      const res = await fetch('http://localhost:5000/request-hints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: '+919342377230' })
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus('Thy mystical scroll shall arrive shortly!');
      } else {
        setSmsStatus('Alas! The messenger raven lost its way.');
      }
    } catch (error) {
      setSmsStatus('A dark spell prevented the message from being sent.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <button
        onClick={toggleMusic}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#8B4513',
          color: '#f4d03f',
          border: '2px solid #5C2C0C',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: '"IM Fell English", Georgia, serif',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          transform: isMusicPlaying ? 'scale(1.05)' : 'scale(1)',
          opacity: isMusicPlaying ? '1' : '0.8',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = isMusicPlaying ? 'scale(1.1)' : 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = isMusicPlaying ? 'scale(1.05)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }}
      >
        {isMusicPlaying ? '🎵 Music Off' : '🔇 Music On'}
      </button>

      <button
        onClick={() => setShowHints(!showHints)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '180px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#8B4513',
          color: '#f4d03f',
          border: '2px solid #5C2C0C',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: '"IM Fell English", Georgia, serif',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }}
      >
        📜 Hints
      </button>

      {showHints && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '300px',
          backgroundColor: '#f4d03f',
          padding: '20px',
          border: '8px double #8B4513',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontFamily: '"IM Fell English", Georgia, serif',
          color: '#4B2504',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          <h3 style={{ 
            textAlign: 'center', 
            margin: '0 0 15px 0',
            fontFamily: '"MedievalSharp", cursive'
          }}>
            🎭 Quick Tips for the Wise 📜
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            margin: '0 0 20px 0'
          }}>
            <li style={{ marginBottom: '10px' }}>• Begin with "Verily" or "Forsooth"</li>
            <li style={{ marginBottom: '10px' }}>• Use "thee", "thou", and "thy"</li>
            <li style={{ marginBottom: '10px' }}>• Add "-eth" to verbs: "speaketh"</li>
            <li style={{ marginBottom: '10px' }}>• End with "indeed" or "methinks"</li>
          </ul>
          
          <div style={{
            borderTop: '2px solid #8B4513',
            paddingTop: '15px',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0 0 15px 0',
              fontFamily: '"MedievalSharp", cursive',
              fontSize: '16px'
            }}>
              🗝️ Receive Ancient Wisdom via Messenger Raven 🦅
            </p>
            <button
              onClick={requestHintSMS}
              style={{
                padding: '8px 16px',
                backgroundColor: '#8B4513',
                color: '#f4d03f',
                border: '2px solid #5C2C0C',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: '"IM Fell English", Georgia, serif',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📜 Request Sacred Knowledge
            </button>
            {smsStatus && (
              <p style={{
                margin: '10px 0 0 0',
                fontStyle: 'italic',
                fontSize: '14px'
              }}>
                {smsStatus}
              </p>
            )}
          </div>
        </div>
      )}

      <Game />
      {newTitle && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f4d03f',
          padding: '15px 30px',
          borderRadius: '8px',
          border: '2px solid #8B4513',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 10000,
          textAlign: 'center',
          animation: 'slideDown 0.5s ease-out'
        }}>
          <p style={{
            margin: 0,
            fontFamily: '"MedievalSharp", cursive',
            color: '#8B4513',
            fontSize: '18px'
          }}>
            Thou hast earned the title of
          </p>
          <p style={{
            margin: '5px 0 0 0',
            fontFamily: '"MedievalSharp", cursive',
            color: '#8B4513',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {newTitle}
          </p>
        </div>
      )}
      <ErrorBoundary>
        <DialogueBox 
          dialogue={dialogue} 
          showAnswerInput={showAnswerInput} 
          setShowAnswerInput={setShowAnswerInput}
          onSubmitAnswer={onSubmitAnswer}
          analysis={analysis}
          evaluationLoading={evaluationLoading}
          onDismissAnalysis={onDismissAnalysis}
          playerTitle={playerProfile?.currentTitle}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
