import React from 'react';
import type { GameState } from '../game/GameEngine';

interface GameEffectsProps {
  gameState: GameState;
}

const GAME_WIDTH = 320;

export const GameEffects: React.FC<GameEffectsProps> = ({ gameState }) => {
  const { player, isConfused, items, isSlowed } = gameState;

  const getShakeStyle = () => {
    if (!isConfused) return {};
    const shake = Math.sin(Date.now() * 0.02) * 3;
    return {
      transform: `translate(${shake}px, ${shake}px)`
    };
  };

  return (
    <>
      {/* Touch Areas Visual Indicator */}
      {gameState.state === 'playing' && (
        <>
          {/* Left touch area */}
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
          
          {/* Right touch area */}
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
          />
        </>
      )}

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
          pointerEvents: 'none',
          ...getShakeStyle()
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
    </>
  );
};