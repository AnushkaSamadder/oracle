import React, { useState, useEffect, useRef } from 'react';

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
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [userAnswer, setUserAnswer] = useState("");
  const quillSoundRef = useRef(null);
  const audioRef = useRef(null);
  const wordsRef = useRef([]);

  useEffect(() => {
    quillSoundRef.current = new Audio('/assets/audio/soundFx/quill.mp3');
    return () => {
      if (quillSoundRef.current) {
        quillSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!dialogue.visible && quillSoundRef.current) {
      quillSoundRef.current.pause();
      quillSoundRef.current.currentTime = 0;
    }
  }, [dialogue.visible]);

  useEffect(() => {
    if (evaluationLoading && quillSoundRef.current) {
      quillSoundRef.current.pause();
      quillSoundRef.current.currentTime = 0;
    }
  }, [evaluationLoading]);

  useEffect(() => {
    if (dialogue.visible && dialogue.question) {
      playTTS(dialogue.question, dialogue.npcType);
    }
  }, [dialogue.visible, dialogue.question]);

  const playTTS = async (text, characterType) => {
    try {
      const normalizedType = characterType?.toLowerCase().replace(/[^a-z]/g, '') || 'answer';
      console.log('Client requesting TTS for:', { text, characterType: normalizedType });
      const response = await fetch('http://localhost:5000/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text, 
          characterType: normalizedType 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate speech');
      }

      const data = await response.json();
      if (data.audioContent) {
        const byteCharacters = atob(data.audioContent);
        const byteArray = new Uint8Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        
        const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Audio playback error:', error);
            });
          }
          setAudioPlaying(true);
          wordsRef.current = text.split(' ');
          setCurrentWordIndex(0);
        }
      }
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && wordsRef.current.length > 0) {
      const progress = audioRef.current.currentTime / audioRef.current.duration;
      const wordIndex = Math.floor(progress * wordsRef.current.length);
      setCurrentWordIndex(wordIndex);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setCurrentWordIndex(-1);
    if (audioRef.current) {
      URL.revokeObjectURL(audioRef.current.src);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key.length === 1 && quillSoundRef.current) {
      quillSoundRef.current.pause();
      quillSoundRef.current.currentTime = 0;
      quillSoundRef.current.play();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quillSoundRef.current) {
      quillSoundRef.current.pause();
      quillSoundRef.current.currentTime = 0;
    }
    setUserAnswer(answer);
    onSubmitAnswer(answer);
    setAnswer('');
  };

  const renderHighlightedText = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        style={{
          color: index === currentWordIndex ? '#f4d03f' : '#4B2504',
          fontWeight: index === currentWordIndex ? 'bold' : 'normal',
          transition: 'all 0.2s ease'
        }}
      >
        {word}{' '}
      </span>
    ));
  };

  if (!dialogue.visible) return null;

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

  return (
    <div id="dialogue-container" style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
      zIndex: 9999,
      backgroundColor: '#f4d03f',
      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      padding: '25px',
      border: '8px double #8B4513',
      borderRadius: '4px',
      boxShadow: '0 0 20px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,69,19,0.2)',
      width: '700px',
      height: 'auto',
      maxHeight: '600px',
      fontFamily: '"IM Fell English", Georgia, serif',
      color: '#4B2504'
    }}>
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

      <div style={{
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        padding: '20px 40px',
        marginBottom: '20px',
        marginTop: playerTitle ? '10px' : '0'
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
          }}>
            {renderHighlightedText(dialogue.question)}
          </p>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />

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
          padding: '15px',
          border: '2px solid #8B4513',
          borderRadius: '4px',
          backgroundColor: '#fff9e6',
          color: '#4B2504',
          fontFamily: '"IM Fell English", Georgia, serif',
          width: '90%',
          marginTop: '10px'
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
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8e7b3',
            borderRadius: '4px',
            border: '1px solid #8B4513'
          }}>
            <p style={{
              fontSize: '14px',
              margin: '0 0 5px 0',
              fontStyle: 'italic'
            }}>
              Your answer:
            </p>
            <p style={{
              margin: '0',
              fontSize: '16px'
            }}>
              {renderHighlightedText(userAnswer)}
            </p>
          </div>
          <p style={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            margin: '10px 0'
          }}>Evaluation:</p>
          <p style={{ 
            fontSize: '14px',
            lineHeight: '1.4',
            margin: '0 0 15px 0'
          }}>{analysis}</p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '15px'
          }}>
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
        </div>
      ) : (
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
                } else {
                  handleKeyPress(e);
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
