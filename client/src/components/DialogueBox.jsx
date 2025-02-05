import React, { useState } from 'react';

const DialogueBox = ({ dialogue, showAnswerInput, setShowAnswerInput, onSubmitAnswer }) => {
  const [answer, setAnswer] = useState('');

  if (!dialogue.visible) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitAnswer(answer);
    setAnswer('');
  };

  return (
    <div id="dialogue-container" style={{
      position: 'fixed',
      left: '50%',
      top: '20%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      zIndex: 9999,
      backgroundColor: '#f4d03f',  // Parchment yellow
      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px',  // Create a subtle paper texture
      padding: '30px',
      border: '8px double #8B4513',  // Double border for ornate look
      borderRadius: '4px',
      boxShadow: '0 0 20px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,69,19,0.2)',  // Outer and inner shadow
      minWidth: '300px',
      fontFamily: '"IM Fell English", Georgia, serif',  // Old-style font
      color: '#4B2504'
    }}>
      {/* Question Box */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        padding: '20px 40px',
        marginBottom: '20px'
      }}>
        {/* Decorative elements */}
        <div style={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '10px',
          backgroundImage: 'radial-gradient(circle, #8B4513 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }} />
        <p style={{ 
          margin: '10px 0',
          fontSize: '20px',
          fontWeight: 'bold',
          lineHeight: '1.4',
          textShadow: '1px 1px 0 rgba(255,255,255,0.5)'
        }}>{dialogue.question}</p>
        <div style={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '10px',
          backgroundImage: 'radial-gradient(circle, #8B4513 1px, transparent 1px)',
          backgroundSize: '10px 10px'
        }} />
      </div>

      {/* Answer Section */}
      {!showAnswerInput ? (
        <button 
          onClick={() => setShowAnswerInput(true)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#8B4513',
            color: '#f4d03f',
            border: '2px solid #5C2C0C',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            fontFamily: '"IM Fell English", Georgia, serif',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            textShadow: '1px 1px 0 rgba(0,0,0,0.5)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
        >
          Answer Question
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{
          width: '100%',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
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
              width: '70%',
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#fff9e6',
              border: '2px solid #8B4513',
              borderRadius: '4px',
              fontFamily: '"IM Fell English", Georgia, serif',
              color: '#4B2504',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              outline: 'none'
            }}
            autoFocus
          />
          <button type="submit" style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#8B4513',
            color: '#f4d03f',
            border: '2px solid #5C2C0C',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: '"IM Fell English", Georgia, serif',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            textShadow: '1px 1px 0 rgba(0,0,0,0.5)'
          }}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default DialogueBox;
