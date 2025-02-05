import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Game from './Game.jsx';
import DialogueBox from './components/DialogueBox.jsx';

function App() {
  // Hold dialogue state in React
  const [dialogue, setDialogue] = useState({ visible: false, question: '' });
  const [showAnswerInput, setShowAnswerInput] = useState(false);

  // Memoize callbacks to prevent unnecessary re-renders
  const onShowDialogue = useCallback((question) => {
    setDialogue({ visible: true, question });
    setShowAnswerInput(false);
  }, []);

  const onHideDialogue = useCallback(() => {
    setDialogue({ visible: false, question: '' });
    setShowAnswerInput(false);
  }, []);

  const onSubmitAnswer = useCallback((answer) => {
    console.log('User submitted answer:', answer);
    if (window.mainScene && typeof window.mainScene.onPlayerAnswer === 'function') {
      window.mainScene.onPlayerAnswer(answer);
    }
    onHideDialogue();
  }, [onHideDialogue]);

  useEffect(() => {
    // Expose these callbacks so that Phaser's MainScene can call them.
    window.dialogueCallbacks = { onShowDialogue, onHideDialogue };
    
    // Cleanup on unmount
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
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
