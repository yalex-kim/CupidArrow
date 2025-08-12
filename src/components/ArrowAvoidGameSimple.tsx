import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { RankingManager } from '../services/RankingManager';
import type { RankingEntry } from '../services/notionService';

// Screen components
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { NameInputScreen } from './screens/NameInputScreen';
import { RankingScreen } from './screens/RankingScreen';

type GameStateType = 'start' | 'playing' | 'nameInput' | 'rankings';

const ArrowAvoidGameSimple = () => {
  // Core managers
  const gameEngineRef = useRef<GameEngine | null>(null);
  const rankingManagerRef = useRef<RankingManager | null>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  // Game state
  const [currentScreen, setCurrentScreen] = useState<GameStateType>('start');
  const [gameState, setGameState] = useState<any>(null);
  
  // UI state
  const [playerName, setPlayerName] = useState('');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [touchControls, setTouchControls] = useState({ left: false, right: false });

  // Game control refs
  const keysRef = useRef<{[key: string]: boolean}>({});
  const gameUpdateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize managers
  useEffect(() => {
    gameEngineRef.current = new GameEngine();
    rankingManagerRef.current = new RankingManager();
    
    setGameState(gameEngineRef.current.getState());
    setRankings(rankingManagerRef.current.getRankings());

    return () => {
      gameEngineRef.current?.destroy();
    };
  }, []);

  // Game state updater
  const updateGameState = useCallback(() => {
    if (!gameEngineRef.current) return;

    const newState = gameEngineRef.current.getState();
    setGameState(newState);
    
    // Handle game over
    if (newState.lives <= 0 && newState.state === 'playing' && currentScreen === 'playing') {
      const finalScore = newState.score;
      gameEngineRef.current.setFinalScore(finalScore);
      
      if (rankingManagerRef.current?.checkRankingEligibility(finalScore)) {
        setCurrentScreen('nameInput');
      } else {
        setCurrentScreen('rankings');
      }
    }
  }, [currentScreen]);

  // Game update loop
  useEffect(() => {
    if (currentScreen === 'playing') {
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
  }, [currentScreen, updateGameState]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      if (currentScreen === 'playing' && gameEngineRef.current) {
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
  }, [currentScreen]);

  // Player movement
  useEffect(() => {
    if (currentScreen === 'playing' && gameEngineRef.current) {
      const moveInterval = setInterval(() => {
        gameEngineRef.current!.movePlayer('left', keysRef.current, touchControls);
      }, 16);

      return () => clearInterval(moveInterval);
    }
  }, [currentScreen, touchControls]);

  // Refresh rankings when entering rankings screen
  useEffect(() => {
    if (currentScreen === 'rankings' && rankingManagerRef.current) {
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
  }, [currentScreen]);

  // Screen transition handlers
  const handleStartGame = () => {
    gameEngineRef.current?.startGame();
    setCurrentScreen('playing');
  };

  const handleShowRankings = () => {
    setCurrentScreen('rankings');
  };

  const handleShowStart = () => {
    setCurrentScreen('start');
  };

  const handleSubmitRanking = async () => {
    if (!playerName.trim() || !rankingManagerRef.current || !gameEngineRef.current) return;
    
    const currentState = gameEngineRef.current.getState();
    setIsLoadingRankings(true);
    
    try {
      await rankingManagerRef.current.submitRanking(
        playerName.trim(), 
        currentState.finalScore, 
        currentState.level
      );
      
      const updatedRankings = rankingManagerRef.current.getRankings();
      setRankings(updatedRankings);
      setPlayerName('');
      setCurrentScreen('rankings');
    } catch (error) {
      console.error('Failed to submit ranking:', error);
    } finally {
      setIsLoadingRankings(false);
    }
  };

  const handleNameInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitRanking();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gameState || currentScreen !== 'playing') return;
    
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

  const handleItemUse = (itemType: 'shield' | 'speed') => {
    gameEngineRef.current?.useItem(itemType);
  };

  // Sharing functions
  const shareGameLink = () => {
    if (!gameState) return;
    
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
    if (!rankingRef.current || !gameState) return;
    
    setIsCapturing(true);
    const { default: html2canvas } = await import('html2canvas');
    
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

  // Loading state
  if (!gameState) {
    return <div>Loading...</div>;
  }

  // Render current screen
  switch (currentScreen) {
    case 'start':
      return (
        <StartScreen
          onStartGame={handleStartGame}
          onShowRankings={handleShowRankings}
        />
      );

    case 'playing':
      return (
        <GameScreen
          gameState={gameState}
          onItemUse={handleItemUse}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          touchControls={touchControls}
        />
      );

    case 'nameInput':
      return (
        <NameInputScreen
          finalScore={gameState.finalScore}
          level={gameState.level}
          playerName={playerName}
          isLoadingRankings={isLoadingRankings}
          onPlayerNameChange={setPlayerName}
          onSubmitRanking={handleSubmitRanking}
          onShowRankings={handleShowRankings}
          onKeyPress={handleNameInputKeyPress}
        />
      );

    case 'rankings':
      return (
        <RankingScreen
          rankings={rankings}
          finalScore={gameState.finalScore}
          isCapturing={isCapturing}
          onCaptureAndShare={captureAndShareRanking}
          onShareGameLink={shareGameLink}
          onStartGame={handleStartGame}
          onShowStart={handleShowStart}
          rankingRef={rankingRef as React.RefObject<HTMLDivElement>}
        />
      );

    default:
      return <div>Unknown state</div>;
  }
};

export default ArrowAvoidGameSimple;