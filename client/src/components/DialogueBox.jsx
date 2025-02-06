import React, { useState } from 'react';

const DialogueBox = ({
  dialogue,
  showAnswerInput,
  setShowAnswerInput,
  onSubmitAnswer,
  analysis,
  evaluationLoading,
  onDismissAnalysis,
  playerTitle
}) => {
  const [answer, setAnswer] = useState('');

  if (!dialogue.visible) return null;

  // Compute villager reaction based on evaluation score when analysis is available
  let villagerReaction = null;
  if (analysis && !evaluationLoading) {
    const scoreMatch = analysis.match(/Tally:\s*(\d+)/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      if (score >= 75) {
        villagerReaction = "Verily, the villager's face doth shine with the radiance of thy wise counsel!";
      } else if (score >= 50) {
        villagerReaction = "The villager pondereth thy words with measured contemplation.";
      } else {
        villagerReaction = "Alas, the villager's countenance darkens at thy questionable wisdom.";
      }
    }
  }

  const portraitStyle = {
    width: '96px',
    height: '96px',
    objectFit: 'cover',
    border: '3px solid #8B4513',
    marginRight: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  };

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
      backgroundColor: '#f4d03f',  /* Parchment yellow */
      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      padding: '30px',
      border: '8px double #8B4513',
      borderRadius: '4px',
      boxShadow: '0 0 20px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,69,19,0.2)',
      minWidth: '300px',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#4B2504'
    }}>
      {/* Title Display */}
      {playerTitle && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#8B4513',
          color: '#f4d03f',
          padding: '5px 15px',
          borderRadius: '15px',
          fontFamily: '"MedievalSharp", cursive',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          border: '1px solid #5C2C0C',
          whiteSpace: 'nowrap'
        }}>
          {playerTitle}
        </div>
      )}

      {/* Question Box with Portrait */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        padding: '20px 40px',
        marginBottom: '20px',
        marginTop: playerTitle ? '10px' : '0' // Add margin if title is present
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '15px'
        }}>
          <img 
            src={`/assets/npcPortraits/${dialogue.npcType}.png`}
            alt={dialogue.npcType}
            style={portraitStyle}
          />
          <p style={{ 
            margin: '10px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            lineHeight: '1.4',
            textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
            fontFamily: '"MedievalSharp", cursive'
          }}>{dialogue.question}</p>
        </div>
      </div>

      {/* Evaluation Loading / Analysis Display */}
      {evaluationLoading ? (
        <div style={{
          fontSize: '16px',
          fontFamily: '"Caudex", serif',
          color: '#4B2504'
        }}>
          Evaluating thy counsel...
        </div>
      ) : analysis ? (
        <div style={{
          padding: '20px',
          border: '2px solid #8B4513',
          borderRadius: '4px',
          backgroundColor: '#fff9e6',
          color: '#4B2504',
          fontFamily: '"IM Fell English", Georgia, serif'
        }}>
          {villagerReaction && (
            <p style={{
              fontSize: '18px', 
              fontFamily: '"MedievalSharp", cursive',
              color: '#4B2504',
              fontStyle: 'italic',
              margin: '0 0 15px 0',
              padding: '0 0 15px 0',
              borderBottom: '1px solid #8B4513',
              textAlign: 'center'
            }}>
              {villagerReaction}
            </p>
          )}
          <p style={{ 
            fontWeight: 'bold', 
            fontSize: '18px',
            fontFamily: '"Caudex", serif'
          }}>Evaluation:</p>
          <p style={{ 
            fontSize: '16px',
            fontFamily: '"Caudex", serif',
            lineHeight: '1.5'
          }}>{analysis}</p>
          <button 
            onClick={onDismissAnalysis}
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
          >
            Continue
          </button>
        </div>
      ) : (
        // Answer Section
        !showAnswerInput ? (
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
              placeholder="Enter thy counsel..."
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
        )
      )}
    </div>
  );
};

export default DialogueBox;
