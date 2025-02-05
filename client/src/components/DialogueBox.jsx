import React, { useState, useEffect } from 'react';

const DialogueBox = () => {
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const scene = window.mainScene;
    if (!scene || !scene.events) return;

    const showHandler = (data) => {
      console.log('DialogueBox received showDialogue event:', data);
      setQuestion(data.question);
      setVisible(true);
      // Focus the input when dialogue appears
      setTimeout(() => {
        const input = document.querySelector('#answer-input');
        if (input) input.focus();
      }, 100);
    };

    const hideHandler = () => {
      setVisible(false);
      setQuestion('');
      setAnswer('');
    };

    scene.events.on('showDialogue', showHandler);
    scene.events.on('hideDialogue', hideHandler);

    return () => {
      scene.events.off('showDialogue', showHandler);
      scene.events.off('hideDialogue', hideHandler);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting answer:', answer);
    if (window.mainScene && window.mainScene.events) {
      window.mainScene.events.emit('playerAnswer', answer);
    }
    setVisible(false);
    setAnswer('');
  };

  if (!visible) return null;

  return (
    <div id="dialogue-container" style={{
      backgroundColor: 'rgba(255, 255, 224, 0.95)',
      border: '2px solid #8B4513',
      borderRadius: '8px',
      padding: '20px',
      width: '60%',
      textAlign: 'center',
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      <p style={{ 
        margin: '0 0 15px 0',
        fontWeight: 'bold',
        color: '#4B2504'
      }}>{question}</p>
      <form onSubmit={handleSubmit}>
        <input
          id="answer-input"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type your answer in Shakespearean English..."
          aria-label="Your answer in Shakespearean English"
          style={{
            width: '80%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #8B4513',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        />
        <button type="submit" style={{
          marginLeft: '10px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#8B4513',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default DialogueBox;
