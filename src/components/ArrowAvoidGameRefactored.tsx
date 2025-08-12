import { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { GameEngine } from '../game/GameEngine';
import { RankingManager } from '../services/RankingManager';
import type { RankingEntry } from '../services/notionService';
import { GameUI } from './GameUI';
import { GameObjects } from './GameObjects';
import { GameEffects } from './GameEffects';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;

const ArrowAvoidGameRefactored = () => {
  // Game Engine and Managers
  const gameEngineRef = useRef<GameEngine | null>(null);
  const rankingManagerRef = useRef<RankingManager | null>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  // Component State
  const [gameState, setGameState] = useState<any>(() => ({
    state: 'start',
    level: 1,
    lives: 3,
    score: 0,
    finalScore: 0,
    player: { x: 160, y: 420, size: 50, id: 0 },
    arrows: [],
    confusionItems: [],
    slowItems: [],
    speedTrails: [],
    isConfused: false,
    confusionTime: 0,
    isSlowed: false,
    slowTime: 0,
    isInvincible: false,
    invincibilityTime: 0,
    items: {
      shield: { count: 1, active: false, time: 0 },
      speed: { count: 1, active: false, time: 0 }
    }
  }));
  const [playerName, setPlayerName] = useState('');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [touchControls, setTouchControls] = useState({
    left: false,
    right: false
  });

  // Refs
  const keysRef = useRef<{[key: string]: boolean}>({});
  const gameUpdateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize game engine and ranking manager
  useEffect(() => {
    gameEngineRef.current = new GameEngine();
    rankingManagerRef.current = new RankingManager();
    
    // Set initial game state
    setGameState(gameEngineRef.current.getState());
    
    const initialRankings = rankingManagerRef.current.getRankings();
    setRankings(initialRankings);

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);

  // Game state updater
  const updateGameState = useCallback(() => {
    if (gameEngineRef.current) {
      const newState = gameEngineRef.current.getState();
      setGameState(newState);
      
      // Check for game over condition
      if (newState.lives <= 0 && newState.state === 'playing') {
        const finalScore = newState.score;
        gameEngineRef.current.setFinalScore(finalScore);
        
        if (rankingManagerRef.current && rankingManagerRef.current.checkRankingEligibility(finalScore)) {
          gameEngineRef.current.setState('nameInput');
        } else {
          gameEngineRef.current.setState('rankings');
        }
      }
    }
  }, []);

  // Start game state update loop
  useEffect(() => {
    if (gameState.state === 'playing') {
      gameUpdateIntervalRef.current = setInterval(updateGameState, 16);
    } else {
      if (gameUpdateIntervalRef.current) {
        clearInterval(gameUpdateIntervalRef.current);
      }
    }

    return () => {
      if (gameUpdateIntervalRef.current) {
        clearInterval(gameUpdateIntervalRef.current);
      }
    };
  }, [gameState.state, updateGameState]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      if (gameState.state === 'playing' && gameEngineRef.current) {
        if (e.key === '1') {
          gameEngineRef.current.useItem('shield');
        } else if (e.key === '2') {
          gameEngineRef.current.useItem('speed');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.state]);

  // Player movement handler
  useEffect(() => {
    if (gameState.state === 'playing' && gameEngineRef.current) {
      const moveInterval = setInterval(() => {
        gameEngineRef.current!.movePlayer('left', keysRef.current, touchControls);
      }, 16);

      return () => clearInterval(moveInterval);
    }
  }, [gameState.state, touchControls]);

  // Rankings refresh on screen change
  useEffect(() => {
    if (gameState.state === 'rankings' && rankingManagerRef.current) {
      const refreshRankings = async () => {
        setIsLoadingRankings(true);
        try {
          const updatedRankings = await rankingManagerRef.current!.refreshRankings();
          setRankings(updatedRankings);
        } finally {
          setIsLoadingRankings(false);
        }
      };
      refreshRankings();
    }
  }, [gameState.state]);

  // Game actions
  const startGame = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
      setGameState(gameEngineRef.current.getState());
    }
  };

  const handleItemUse = (itemType: 'shield' | 'speed') => {
    if (gameEngineRef.current) {
      gameEngineRef.current.useItem(itemType);
    }
  };

  const submitRanking = async () => {
    if (!playerName.trim() || !rankingManagerRef.current || !gameEngineRef.current) return;
    
    const currentState = gameEngineRef.current.getState();
    
    try {
      await rankingManagerRef.current.submitRanking(
        playerName.trim(), 
        currentState.finalScore, 
        currentState.level
      );
      
      const updatedRankings = rankingManagerRef.current.getRankings();
      setRankings(updatedRankings);
    } catch (error) {
      console.error('Failed to submit ranking:', error);
    }
    
    setPlayerName('');
    gameEngineRef.current.setState('rankings');
    setGameState(gameEngineRef.current.getState());
  };

  const handleNameInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRanking();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState.state !== 'playing') return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    if (touchX < gameState.player.x) {
      setTouchControls({ left: true, right: false });
    } else if (touchX > gameState.player.x) {
      setTouchControls({ left: false, right: true });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchControls({ left: false, right: false });
  };

  // Sharing functions (keeping the same as before)
  const shareGameLink = () => {
    const gameUrl = window.location.href;
    const shareText = `Cupid Arrow 게임에서 ${gameState.finalScore}점을 기록했어요! 🏆 나도 도전해보세요!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Cupid Arrow 게임',
        text: shareText,
        url: gameUrl
      }).catch((error) => console.log('공유 취소:', error));
    } else {
      const fullText = `${shareText}\n${gameUrl}`;
      navigator.clipboard.writeText(fullText).then(() => {
        alert('게임 링크가 클립보드에 복사되었습니다!');
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('게임 링크가 클립보드에 복사되었습니다!');
      });
    }
  };

  const captureAndShareRanking = async () => {
    if (!rankingRef.current) return;
    
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(rankingRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'cupid-arrow-ranking.png', { type: 'image/png' })] })) {
            const file = new File([blob], 'cupid-arrow-ranking.png', { type: 'image/png' });
            navigator.share({
              title: 'Cupid Arrow 게임 랭킹',
              text: `Cupid Arrow 게임에서 ${gameState.finalScore}점을 기록했어요! 🏆`,
              files: [file]
            });
          } else if (navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]).then(() => {
              alert('랭킹 이미지가 클립보드에 복사되었습니다!');
            }).catch(() => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'cupid-arrow-ranking.png';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              alert('이미지가 다운로드되었습니다!');
            });
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('캡처 실패:', error);
      alert('캡처에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  // State change helpers
  const setGameStateValue = (newState: 'start' | 'playing' | 'nameInput' | 'rankings') => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setState(newState);
      setGameState(gameEngineRef.current.getState());
    }
  };

  // Render different screens
  if (gameState.state === 'start') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #fecaca, #f87171)',
        padding: '16px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '16px'
        }}>💘 화살 피하기 💘</h1>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>게임 방법</h2>
          <div style={{
            textAlign: 'left',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            color: '#1f2937'
          }}>
            <p style={{ marginBottom: '8px' }}>🏃 <strong>이동:</strong> ← → 화살표 또는 A, D 키</p>
            <p style={{ marginBottom: '8px' }}>🛡️ <strong>방어막:</strong> 1번 키 (3초간 보호)</p>
            <p style={{ marginBottom: '8px' }}>⚡ <strong>스피드:</strong> 2번 키 (이동속도 증가)</p>
            <p style={{ marginBottom: '8px' }}>💕 생명: 3개</p>
            <p style={{ marginBottom: '8px' }}>🎯 목표: 화살을 피하며 최대한 오래 버티기!</p>
            <p style={{ marginBottom: '8px' }}>📈 레벨업: 500점마다 난이도 증가 (최대 4레벨)</p>
          </div>
          <button 
            onClick={startGame}
            style={{
              marginTop: '24px',
              backgroundColor: '#dc2626',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            게임 시작
          </button>
          <button 
            onClick={() => setGameStateValue('rankings')}
            style={{
              marginTop: '24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            랭킹 보기
          </button>
        </div>
      </div>
    );
  }

  if (gameState.state === 'nameInput') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%)',
        padding: '16px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '8px',
            animation: 'pulse 2s infinite'
          }}>🎉</div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            marginBottom: '8px'
          }}>랭킹 진입!</h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'white',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>TOP 10에 진입했습니다! ⭐</p>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(251, 191, 36, 0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          border: '3px solid rgba(251, 191, 36, 0.5)'
        }}>
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '8px'
            }}>🏆 당신의 기록 🏆</div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '4px'
            }}>{gameState.finalScore}점</div>
            <div style={{ 
              fontSize: '1.2rem',
              color: '#7c2d12'
            }}>레벨 {gameState.level} 달성</div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              ✨ 플레이어 이름을 입력하세요 ✨
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={handleNameInputKeyPress}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '3px solid #fbbf24',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '1.2rem',
                fontWeight: '500',
                backgroundColor: 'white',
                color: '#374151',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                outline: 'none'
              }}
              placeholder="이름 입력 (최대 10글자)"
              maxLength={10}
              autoFocus
            />
          </div>
          
          <button 
            onClick={submitRanking}
            disabled={!playerName.trim() || isLoadingRankings}
            style={{
              backgroundColor: !playerName.trim() || isLoadingRankings ? '#9ca3af' : '#dc2626',
              color: 'white',
              fontWeight: 'bold',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: !playerName.trim() || isLoadingRankings ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '1.1rem',
              marginBottom: '12px'
            }}
          >
            {isLoadingRankings ? '⏳ 등록 중...' : '🏆 랭킹에 등록하기 🏆'}
          </button>
          
          <button 
            onClick={() => setGameStateValue('rankings')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem'
            }}
          >
            📊 랭킹 보기
          </button>
        </div>
      </div>
    );
  }

  if (gameState.state === 'rankings') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#f87171',
          marginBottom: '16px'
        }}>🏆 랭킹 🏆</h1>
        <div 
          ref={rankingRef}
          style={{
            backgroundColor: 'white',
            padding: '16px 24px 24px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#6b21a8' 
            }}>🏆 TOP 10 랭킹</h3>
            <div style={{ 
              textAlign: 'left', 
              fontSize: '0.75rem',
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              {rankings.slice(0, 10).map((entry, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  marginBottom: '2px',
                  backgroundColor: entry.score === gameState.finalScore ? '#fef3c7' : 'white',
                  border: entry.score === gameState.finalScore ? '2px solid #fbbf24' : '1px solid #d1d5db'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 'bold',
                      marginRight: '6px',
                      minWidth: '18px',
                      color: index < 3 ? '#dc2626' : '#6b7280',
                      fontSize: '0.7rem'
                    }}>
                      {index + 1}.
                    </span>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{entry.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      gap: '6px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '0.7rem' }}>{entry.score}점</span>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>Lv.{entry.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            paddingTop: '12px', 
            marginTop: '12px',
            position: 'relative',
            marginBottom: '16px'
          }}>
            <p style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              margin: 0, 
              color: '#dc2626',
              textAlign: 'left',
              paddingLeft: '20px'
            }}>
              최종 점수: {gameState.finalScore}점
            </p>
            
            <div style={{ 
              position: 'absolute',
              right: 0,
              top: '12px',
              display: 'flex', 
              gap: '8px' 
            }}>
              <button 
                onClick={captureAndShareRanking}
                disabled={isCapturing}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: isCapturing ? 'not-allowed' : 'pointer',
                  fontSize: '2rem',
                  padding: '4px',
                  width: '40px',
                  height: '40px'
                }}
              >
                {isCapturing ? <span style={{ color: '#9ca3af' }}>⏳</span> : <span style={{ color: '#667eea' }}>📸</span>}
              </button>

              <button 
                onClick={shareGameLink}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '2rem',
                  padding: '4px',
                  width: '40px',
                  height: '40px'
                }}
              >
                <span style={{ color: '#667eea' }}>⤴️</span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={startGame}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                fontWeight: 'bold',
                padding: '20px 32px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                flex: '1',
                minWidth: '110px',
                fontSize: '1rem'
              }}
            >
              재도전
            </button>
            <button 
              onClick={() => setGameStateValue('start')}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                fontWeight: 'bold',
                padding: '20px 32px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                flex: '1',
                minWidth: '110px',
                fontSize: '1rem'
              }}
            >
              메인 메뉴
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '16px'
    }}>
      <div 
        style={{
          position: 'relative',
          border: '4px solid #1f2937',
          background: 'linear-gradient(to bottom, #93c5fd, #86efac)',
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          ...(gameState.isConfused ? {
            transform: `translate(${Math.sin(Date.now() * 0.02) * 3}px, ${Math.sin(Date.now() * 0.02) * 3}px)`
          } : {})
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, #86efac, #16a34a)',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none'
          } as React.CSSProperties}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onTouchMove={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <GameUI gameState={gameState} onItemUse={handleItemUse} />
          <GameEffects gameState={gameState} />
          <GameObjects gameState={gameState} />
        </div>
      </div>
      
      <div style={{
        marginTop: '8px',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#6b7280',
        padding: '0 16px'
      }}>
        PC: 화살표 키 또는 A/D + 1,2 키 | 모바일: 플레이어 기준 좌우 터치로 이동
      </div>
    </div>
  );
};

export default ArrowAvoidGameRefactored;