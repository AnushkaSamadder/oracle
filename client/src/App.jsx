import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Game from './Game.jsx';
import DialogueBox from './components/DialogueBox.jsx';

function App() {
  // Hold dialogue state in React
  const [dialogue, setDialogue] = useState({ visible: false, question: '', npcType: '' });
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");

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
  // It calls the /evaluate endpoint and stores the evaluation feedback.
  const onSubmitAnswer = useCallback(async (answer) => {
    setEvaluationLoading(true);
    setUserAnswer(answer);
    try {
      const res = await fetch('http://localhost:5000/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: dialogue.question, answer })
      });
      const data = await res.json();
      setAnalysis(data.feedback || "No feedback available.");
    } catch (err) {
      console.error("Evaluation error:", err);
      setAnalysis("Evaluation error occurred.");
    } finally {
      setEvaluationLoading(false);
    }
  }, [dialogue.question]);

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
      <ErrorBoundary>
        <DialogueBox 
          dialogue={dialogue} 
          showAnswerInput={showAnswerInput} 
          setShowAnswerInput={setShowAnswerInput}
          onSubmitAnswer={onSubmitAnswer}
          analysis={analysis}
          evaluationLoading={evaluationLoading}
          onDismissAnalysis={onDismissAnalysis}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
