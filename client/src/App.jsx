import React, { useState, useEffect, useCallback } from 'react';
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

  // Initialize FingerprintJS when the app loads
  useEffect(() => {
    const initFingerprintJS = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setVisitorId(result.visitorId);
        console.log('Visitor ID:', result.visitorId);
        // Make visitorId available globally for MainScene
        window.visitorId = result.visitorId;
      } catch (error) {
        console.error('Error initializing FingerprintJS:', error);
      }
    };

    initFingerprintJS();
  }, []);

  // Fetch player profile when visitorId is available
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
  
  // Callback to show dialogue – called from MainScene
  const onShowDialogue = useCallback((question, npcType) => {
    setDialogue({ visible: true, question, npcType });
    setShowAnswerInput(false);
    setAnalysis("");
    setUserAnswer("");
  }, []);

  // Callback to hide dialogue – called from MainScene or after answer dismissal
  const onHideDialogue = useCallback(() => {
    setDialogue({ visible: false, question: '' });
    setShowAnswerInput(false);
    setAnalysis("");
    setUserAnswer("");
  }, []);

  // Callback when the user submits an answer in the DialogueBox.
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

      // Fetch updated player profile after evaluation
      if (visitorId) {
        const profileRes = await fetch(`http://localhost:5000/player/${visitorId}`);
        const newProfile = await profileRes.json();
        
        // Check if title changed
        if (newProfile.currentTitle !== playerProfile?.currentTitle) {
          setNewTitle(newProfile.currentTitle);
          setTimeout(() => setNewTitle(null), 3000); // Hide after 3 seconds
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

  // Callback when the user dismisses the analysis view.
  // This calls MainScene's onPlayerAnswer to resume the NPC's exit.
  const onDismissAnalysis = useCallback(() => {
    if (window.mainScene && typeof window.mainScene.onPlayerAnswer === 'function') {
      window.mainScene.onPlayerAnswer(userAnswer);
    }
    onHideDialogue();
  }, [userAnswer, onHideDialogue]);

  useEffect(() => {
    // Expose these callbacks so that Phaser’s MainScene can call them.
    window.dialogueCallbacks = { onShowDialogue, onHideDialogue };
    return () => {
      window.dialogueCallbacks = null;
    };
  }, [onShowDialogue, onHideDialogue]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
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
