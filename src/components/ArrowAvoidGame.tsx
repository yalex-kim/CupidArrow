import { useState, useEffect, useCallback, useRef } from 'react';
import { saveRankingToNotion, getRankingsFromNotion, type RankingEntry } from '../services/notionService';
import html2canvas from 'html2canvas';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;
const PLAYER_SIZE = 50;
const ARROW_SIZE = 12;

const ArrowDodgeGame = () => {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver', 'nameInput', 'rankings'
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [rankings, setRankings] = useState<RankingEntry[]>([
    { name: "화살마스터", score: 2500, level: 4 },
    { name: "천사", score: 2000, level: 4 },
    { name: "하트", score: 1800, level: 4 },
    { name: "사랑이", score: 1500, level: 3 },
    { name: "화살", score: 1200, level: 3 },
    { name: "핑크", score: 1000, level: 2 },
    { name: "로맨스", score: 800, level: 2 },
    { name: "달링", score: 600, level: 2 },
    { name: "허니", score: 400, level: 1 },
    { name: "러브", score: 200, level: 1 }
  ]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const rankingRef = useRef<HTMLDivElement>(null);
  const collisionProcessing = useRef(false);
  const [player, setPlayer] = useState({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const [arrows, setArrows] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [confusionItems, setConfusionItems] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [slowItems, setSlowItems] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [isConfused, setIsConfused] = useState(false);
  const [confusionTime, setConfusionTime] = useState(0);
  const [isSlowed, setIsSlowed] = useState(false);
  const [slowTime, setSlowTime] = useState(0);
  const [isInvincible, setIsInvincible] = useState(false);
  const [invincibilityTime, setInvincibilityTime] = useState(0);
  const [touchControls, setTouchControls] = useState({
    left: false,
    right: false
  });
  const [speedTrails, setSpeedTrails] = useState<Array<{x: number, y: number, id: number, opacity: number}>>([]);
  
  // Items
  type ItemType = 'shield' | 'speed';
  const [items, setItems] = useState<{
    shield: { count: number; active: boolean; time: number };
    speed: { count: number; active: boolean; time: number };
  }>({
    shield: { count: 1, active: false, time: 0 },
    speed: { count: 1, active: false, time: 0 }
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const keysRef = useRef<{[key: string]: boolean}>({});

  useEffect(() => {
    const loadRankings = async () => {
      const notionRankings = await getRankingsFromNotion();
      if (notionRankings.length > 0) {
        setRankings(notionRankings);
      }
    };
    
    loadRankings();
  }, []);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Item usage
      if (gameState === 'playing') {
        if (e.key === '1' && items.shield.count > 0 && !items.shield.active) {
          useItem('shield');
        } else if (e.key === '2' && items.speed.count > 0 && !items.speed.active) {
          useItem('speed');
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
  }, [gameState, items]);

  const useItem = (itemType: ItemType) => {
    setItems(prev => ({
      ...prev,
      [itemType]: {
        ...prev[itemType],
        count: prev[itemType].count - 1,
        active: true,
        time: itemType === 'shield' ? 3000 : 5000
      }
    }));
  };

  const startGame = () => {
    setGameState('playing');
    setLives(3);
    setScore(0);
    setFinalScore(0);
    setLevel(1);
    setPlayer({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
    setArrows([]);
    setConfusionItems([]);
    setSlowItems([]);
    setIsConfused(false);
    setConfusionTime(0);
    setIsSlowed(false);
    setSlowTime(0);
    setIsInvincible(false);
    setInvincibilityTime(0);
    setSpeedTrails([]);
    setItems({
      shield: { count: 1, active: false, time: 0 },
      speed: { count: 1, active: false, time: 0 }
    });
    collisionProcessing.current = false;
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Player movement
    setPlayer(prev => {
      let newX = prev.x;
      let baseSpeed = items.speed.active ? 3 : 2;
      const speed = isSlowed ? Math.max(1, baseSpeed * 0.3) : baseSpeed;
      
      if (keysRef.current['arrowleft'] || keysRef.current['a'] || touchControls.left) {
        newX = Math.max(PLAYER_SIZE / 2, prev.x - speed);
        
        // Add speed trail effect
        if (items.speed.active && Math.random() < 0.3) {
          setSpeedTrails(prevTrails => [...prevTrails, {
            x: prev.x,
            y: prev.y,
            id: Date.now() + Math.random(),
            opacity: 1
          }]);
        }
      }
      if (keysRef.current['arrowright'] || keysRef.current['d'] || touchControls.right) {
        newX = Math.min(GAME_WIDTH - PLAYER_SIZE / 2, prev.x + speed);
        
        // Add speed trail effect
        if (items.speed.active && Math.random() < 0.3) {
          setSpeedTrails(prevTrails => [...prevTrails, {
            x: prev.x,
            y: prev.y,
            id: Date.now() + Math.random(),
            opacity: 1
          }]);
        }
      }
      
      return { ...prev, x: newX };
    });

    // Spawn arrows
    if (Math.random() < (level >= 2 ? 0.04 : 0.02)) {
      setArrows(prev => [...prev, {
        x: Math.random() * (GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      }]);
    }

    // Spawn confusion items (level 3)
    if (level >= 3 && Math.random() < 0.01) {
      setConfusionItems(prev => [...prev, {
        x: Math.random() * (GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      }]);
    }

    // Spawn slow items (level 4)
    if (level >= 4 && Math.random() < 0.015) {
      setSlowItems(prev => [...prev, {
        x: Math.random() * (GAME_WIDTH - 20) + 10,
        y: 0,
        id: Date.now() + Math.random()
      }]);
    }

    // Move arrows
    setArrows(prev => prev.map(arrow => {
      return { ...arrow, y: arrow.y + 6 };
    }).filter(arrow => arrow && arrow.y > -20 && arrow.y < GAME_HEIGHT + 20));

    // Move confusion items
    setConfusionItems(prev => prev.map(item => ({
      ...item,
      y: item.y + 4
    })).filter(item => item.y < GAME_HEIGHT + 20));

    // Move slow items
    setSlowItems(prev => prev.map(item => ({
      ...item,
      y: item.y + 4
    })).filter(item => item.y < GAME_HEIGHT + 20));


    // Update item timers
    setItems(prev => {
      const newItems = { ...prev };
      (Object.keys(newItems) as ItemType[]).forEach(key => {
        if (newItems[key].active && newItems[key].time > 0) {
          newItems[key].time -= 16;
          if (newItems[key].time <= 0) {
            newItems[key].active = false;
            newItems[key].time = 0;
          }
        }
      });
      return newItems;
    });

    // Update confusion
    if (confusionTime > 0) {
      setConfusionTime(prev => {
        const newTime = prev - 16;
        if (newTime <= 0) {
          setIsConfused(false);
          return 0;
        }
        return newTime;
      });
    }

    // Update slow effect
    if (slowTime > 0) {
      setSlowTime(prev => {
        const newTime = prev - 16;
        if (newTime <= 0) {
          setIsSlowed(false);
          return 0;
        }
        return newTime;
      });
    }

    // Update invincibility
    if (invincibilityTime > 0) {
      setInvincibilityTime(prev => {
        const newTime = prev - 16;
        if (newTime <= 0) {
          setIsInvincible(false);
          return 0;
        }
        return newTime;
      });
    }

    // Update speed trails
    setSpeedTrails(prev => prev.map(trail => ({
      ...trail,
      opacity: trail.opacity - 0.05
    })).filter(trail => trail.opacity > 0));

    // Update score and level
    setScore(prev => prev + 1);
    if (score > 0 && score % 500 === 0 && level < 4) {
      setLevel(prev => prev + 1);
    }
  }, [gameState, level, items, isConfused, confusionTime, isSlowed, slowTime, score, arrows, touchControls]);

  // Check collisions separately to avoid state dependency issues
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check confusion item collisions
    const checkConfusionCollision = () => {
      setConfusionItems(prev => {
        const remainingItems: Array<{x: number, y: number, id: number}> = [];
        let confused = false;

        prev.forEach(item => {
          const distance = Math.sqrt(
            Math.pow(item.x - player.x, 2) + 
            Math.pow(item.y - player.y, 2)
          );

          if (distance < (20 + PLAYER_SIZE) / 2) {
            confused = true;
          } else {
            remainingItems.push(item);
          }
        });

        if (confused) {
          if (items.shield.active) {
            // 쉴드가 활성화되어 있으면 아이템만 제거하고 효과 무시
          } else {
            // 쉴드가 없으면 혼란 효과 적용
            setIsConfused(true);
            setConfusionTime(3000);
          }
        }

        return remainingItems;
      });
    };

    // Check slow item collisions
    const checkSlowCollision = () => {
      setSlowItems(prev => {
        const remainingItems: Array<{x: number, y: number, id: number}> = [];
        let slowed = false;

        prev.forEach(item => {
          const distance = Math.sqrt(
            Math.pow(item.x - player.x, 2) + 
            Math.pow(item.y - player.y, 2)
          );

          if (distance < (20 + PLAYER_SIZE) / 2) {
            slowed = true;
          } else {
            remainingItems.push(item);
          }
        });

        if (slowed) {
          if (items.shield.active) {
            // 쉴드가 활성화되어 있으면 아이템만 제거하고 효과 무시
          } else {
            // 쉴드가 없으면 슬로우 효과 적용
            setIsSlowed(true);
            setSlowTime(4000);
          }
        }

        return remainingItems;
      });
    };

    // Check arrow collisions
    const checkArrowCollision = () => {
      if (isInvincible || collisionProcessing.current) return;
      
      for (const arrow of arrows) {
        const distance = Math.sqrt(
          Math.pow(arrow.x - player.x, 2) + 
          Math.pow(arrow.y - player.y, 2)
        );

        if (distance < 35) {
          collisionProcessing.current = true;
          
          if (items.shield.active) {
            // 쉴드가 활성화되어 있으면 화살만 제거하고 데미지 없음
          } else {
            // 쉴드가 없으면 데미지
            const damage = isConfused ? 2 : 1;
            
            setLives(prevLives => {
              const newLives = prevLives - damage;
              if (newLives <= 0) {
                setFinalScore(score);
                checkRanking(score);
              }
              return Math.max(0, newLives);
            });
            
            // 화살에 맞으면 1.5초간 무적
            setIsInvincible(true);
            setInvincibilityTime(1500);
          }
          
          // 충돌한 화살 제거
          setArrows(prevArrows => 
            prevArrows.filter(arr => arr.id !== arrow.id)
          );
          
          // 500ms 후 충돌 처리 플래그 리셋
          setTimeout(() => {
            collisionProcessing.current = false;
          }, 500);
          
          break; // 첫 번째 충돌에서 멈춤
        }
      }
    };

    checkConfusionCollision();
    checkSlowCollision();
    checkArrowCollision();
  }, [player, gameState, arrows, items.shield.active, isInvincible, isConfused, score]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, 16);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameLoop, gameState]);

  const checkRanking = (finalScore: number) => {
    const lowestRankingScore = rankings.length >= 10 ? rankings[9].score : 0;
    if (finalScore > lowestRankingScore || rankings.length < 10) {
      setGameState('nameInput');
    } else {
      setGameState('gameOver');
    }
  };

  const submitRanking = async () => {
    if (!playerName.trim()) return;
    
    const newEntry: RankingEntry = {
      name: playerName.trim(),
      score: finalScore,
      level: level
    };
    
    setIsLoadingRankings(true);
    
    const success = await saveRankingToNotion(newEntry);
    
    if (success) {
      const updatedRankings = await getRankingsFromNotion();
      if (updatedRankings.length > 0) {
        setRankings(updatedRankings);
      } else {
        const newRankings = [...rankings, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setRankings(newRankings);
      }
    } else {
      const newRankings = [...rankings, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setRankings(newRankings);
    }
    
    setIsLoadingRankings(false);
    setPlayerName('');
    setGameState('gameOver');
  };

  const handleNameInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRanking();
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
            // Native sharing (mobile)
            const file = new File([blob], 'cupid-arrow-ranking.png', { type: 'image/png' });
            navigator.share({
              title: 'Cupid Arrow 게임 랭킹',
              text: `Cupid Arrow 게임에서 ${score}점을 기록했어요! 🏆`,
              files: [file]
            });
          } else {
            // Fallback: download image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cupid-arrow-ranking.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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

  // Touch control handlers for screen touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    console.log('Touch start:', touchX, 'Player X:', player.x); // 디버깅용
    
    // Check if touch is left or right relative to player position
    if (touchX < player.x) {
      setTouchControls({ left: true, right: false });
    } else if (touchX > player.x) {
      setTouchControls({ left: false, right: true });
    } else {
      setTouchControls({ left: false, right: false });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Touch end'); // 디버깅용
    setTouchControls({ left: false, right: false });
  };

  const handleItemUse = (itemType: ItemType) => {
    if (gameState !== 'playing') return;
    
    if (itemType === 'shield' && items.shield.count > 0 && !items.shield.active) {
      useItem('shield');
    } else if (itemType === 'speed' && items.speed.count > 0 && !items.speed.active) {
      useItem('speed');
    }
  };

  const getShakeStyle = () => {
    if (!isConfused) return {};
    const shake = Math.sin(Date.now() * 0.02) * 3;
    return {
      transform: `translate(${shake}px, ${shake}px)`
    };
  };

  if (gameState === 'start') {
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
            onClick={async () => {
              setIsLoadingRankings(true);
              const notionRankings = await getRankingsFromNotion();
              if (notionRankings.length > 0) {
                setRankings(notionRankings);
              }
              setIsLoadingRankings(false);
              setGameState('gameOver');
            }}
            disabled={isLoadingRankings}
            style={{
              marginTop: '24px',
              backgroundColor: isLoadingRankings ? '#9ca3af' : '#7c3aed',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoadingRankings ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoadingRankings ? '⏳ 로딩 중...' : '랭킹 보기'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #4b5563, #1f2937)',
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
          {/* 랭킹 표시 */}
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
                  backgroundColor: entry.score === finalScore && entry.name === rankings.find(r => r.score === finalScore)?.name 
                    ? '#fef3c7' : 'white',
                  border: entry.score === finalScore && entry.name === rankings.find(r => r.score === finalScore)?.name 
                    ? '2px solid #fbbf24' : '1px solid #d1d5db',
                  boxShadow: entry.score === finalScore && entry.name === rankings.find(r => r.score === finalScore)?.name 
                    ? '0 0 8px rgba(251, 191, 36, 0.3)' : 'none'
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
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#dc2626' }}>최종 점수: {finalScore}점</p>
          </div>
          
          {/* 캡처 버튼 */}
          <button 
            onClick={captureAndShareRanking}
            disabled={isCapturing}
            style={{
              backgroundColor: isCapturing ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '0.9rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isCapturing ? (
              <>⏳ 캡처 중...</>
            ) : (
              <>📸 랭킹 캡처 & 공유</>
            )}
          </button>

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
              onClick={() => setGameState('start')}
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

  if (gameState === 'nameInput') {
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
            }}>{finalScore}점</div>
            <div style={{ 
              fontSize: '1.2rem',
              color: '#7c2d12'
            }}>레벨 {level} 달성</div>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
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
              backgroundColor: !playerName.trim() || isLoadingRankings ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              background: !playerName.trim() || isLoadingRankings ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: 'white',
              fontWeight: 'bold',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: !playerName.trim() || isLoadingRankings ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '1.1rem',
              boxShadow: !playerName.trim() || isLoadingRankings ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)',
              transform: !playerName.trim() || isLoadingRankings ? 'none' : 'translateY(-1px)',
              transition: 'all 0.2s'
            }}
          >
            {isLoadingRankings ? '⏳ 등록 중...' : '🏆 랭킹에 등록하기 🏆'}
          </button>
        </div>
      </div>
    );
  }


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
          ...getShakeStyle()
        }}
      >
        {/* Full Game Area - All Ground */}
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
          onTouchMove={(e: React.TouchEvent) => e.preventDefault()}
          onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
        >
          {/* UI */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            zIndex: 50,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none'
          }}>
            <div>❤️ {lives}</div>
            <div>📊 {score}</div>
            <div>🎯 Level {level}</div>
          </div>
          
          {/* Items UI */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: 'white',
            fontSize: '0.75rem',
            zIndex: 50,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none'
          }}>
            <div style={{
              marginBottom: '4px',
              color: items.shield.active ? '#fde047' : 'white'
            }}>
              🛡️ {items.shield.count} (1)
              {items.shield.active && <span style={{ marginLeft: '4px' }}>({Math.ceil(items.shield.time/1000)}s)</span>}
            </div>
            <div style={{
              color: items.speed.active ? '#fde047' : 'white'
            }}>
              ⚡ {items.speed.count} (2)
              {items.speed.active && <span style={{ marginLeft: '4px' }}>({Math.ceil(items.speed.time/1000)}s)</span>}
            </div>
          </div>

          {/* Touch Areas Visual Indicator */}
          {gameState === 'playing' && (
            <>
              {/* Dynamic visual guide based on player position */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  transition: 'all 0.2s',
                  width: player.x
                }}
              >
                <div style={{ color: 'white', fontSize: '3rem', opacity: 0.3, userSelect: 'none', WebkitUserSelect: 'none' }}>←</div>
              </div>
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  height: '100%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  transition: 'all 0.2s',
                  left: player.x,
                  width: GAME_WIDTH - player.x
                }}
              >
                <div style={{ color: 'white', fontSize: '3rem', opacity: 0.3, userSelect: 'none', WebkitUserSelect: 'none' }}>→</div>
              </div>
              
              {/* Player position indicator */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  height: '100%',
                  width: '1px',
                  backgroundColor: 'white',
                  opacity: 0.5,
                  pointerEvents: 'none',
                  left: player.x
                }}
              ></div>
              
            </>
          )}

          {/* Player */}
          <div 
            style={{ 
              position: 'absolute',
              fontSize: '50px',
              zIndex: 20,
              color: items.speed.active ? '#60a5fa' : '#2563eb',
              left: player.x - PLAYER_SIZE/2, 
              top: player.y - PLAYER_SIZE/2,
              textShadow: items.speed.active ? 
                '0 0 10px #60a5fa, 2px 2px 4px rgba(0,0,0,0.8)' : 
                '2px 2px 4px rgba(0,0,0,0.8)',
              filter: items.speed.active ? 'drop-shadow(0 0 8px #60a5fa)' : 'none',
              animation: items.speed.active ? 'pulse 1s infinite' : 
                        isInvincible ? 'blink 0.3s infinite' : 'none',
              opacity: isInvincible && Math.floor(Date.now() / 150) % 2 ? 0.3 : 1,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            🏃
          </div>

          {/* Shield Effect */}
          {items.shield.active && (
            <div 
              style={{
                position: 'absolute',
                left: player.x - 35,
                top: player.y - 35,
                width: '70px',
                height: '70px',
                border: '3px solid rgba(250, 204, 21, 0.8)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0.3) 100%)',
                boxShadow: '0 0 20px rgba(250, 204, 21, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
                zIndex: 19,
                animation: 'pulse 1.5s infinite',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        {/* ALL ARROWS */}
        {arrows.map(arrow => (
          <div
            key={arrow.id}
            style={{
              position: 'absolute',
              zIndex: 50,
              left: arrow.x - ARROW_SIZE/2,
              top: arrow.y - ARROW_SIZE/2,
              fontSize: '20px',
              color: '#dc2626',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            🏹
          </div>
        ))}

        {/* ALL CONFUSION ITEMS */}
        {confusionItems.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              zIndex: 50,
              left: item.x - 8,
              top: item.y - 8,
              fontSize: '20px',
              color: '#7c3aed',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            😵‍💫
          </div>
        ))}

        {/* ALL SLOW ITEMS */}
        {slowItems.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              zIndex: 50,
              left: item.x - 8,
              top: item.y - 8,
              fontSize: '20px',
              color: '#1e40af',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            🐌
          </div>
        ))}

        {/* Speed trails */}
        {speedTrails.map(trail => (
          <div
            key={trail.id}
            style={{
              position: 'absolute',
              zIndex: 10,
              left: trail.x - 15,
              top: trail.y - 15,
              fontSize: '30px',
              opacity: trail.opacity,
              color: '#60a5fa',
              textShadow: '0 0 5px #60a5fa',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            ⭐
          </div>
        ))}

        {/* Confusion overlay */}
        {isConfused && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              color: '#6b21a8',
              fontSize: '4rem',
              animation: 'pulse 1s infinite',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}>😵‍💫</div>
          </div>
        )}

        {/* Speed overlay */}
        {items.speed.active && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            paddingBottom: '16px',
            pointerEvents: 'none'
          }}>
            <div style={{
              color: '#1e40af',
              fontSize: '2rem',
              animation: 'pulse 1s infinite',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}>🚀 터보 모드!</div>
          </div>
        )}

        {/* Slow overlay */}
        {isSlowed && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            paddingBottom: '16px',
            pointerEvents: 'none'
          }}>
            <div style={{
              color: '#1e40af',
              fontSize: '3rem',
              animation: 'pulse 1s infinite',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}>🐌 느려짐!</div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      <div style={{
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '384px'
      }}>
        {/* Item Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          width: '100%'
        }}>
          <button
            onClick={() => handleItemUse('shield')}
            disabled={items.shield.count === 0 || items.shield.active}
            style={{
              backgroundColor: items.shield.count === 0 || items.shield.active ? '#9ca3af' : '#eab308',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: items.shield.count === 0 || items.shield.active ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              touchAction: 'manipulation',
              outline: items.shield.active ? '2px solid #fcd34d' : 'none'
            }}
          >
            🛡️<br/>방어막<br/>({items.shield.count})
          </button>
          
          <button
            onClick={() => handleItemUse('speed')}
            disabled={items.speed.count === 0 || items.speed.active}
            style={{
              backgroundColor: items.speed.count === 0 || items.speed.active ? '#9ca3af' : '#22c55e',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: items.speed.count === 0 || items.speed.active ? 'not-allowed' : 'pointer',
              fontSize: '0.75rem',
              touchAction: 'manipulation',
              outline: items.speed.active ? '2px solid #86efac' : 'none'
            }}
          >
            ⚡<br/>스피드<br/>({items.speed.count})
          </button>
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

export default ArrowDodgeGame;