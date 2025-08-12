import React from 'react';
import type { GameState } from '../../game/GameEngine';
import { GameUI } from '../GameUI';
import { GameObjects } from '../GameObjects';
import { GameEffects } from '../GameEffects';

interface GameScreenProps {
  gameState: GameState;
  onItemUse: (itemType: 'shield' | 'speed') => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  touchControls: { left: boolean; right: boolean };
}

const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onItemUse,
  onTouchStart,
  onTouchEnd
}) => {
  const getShakeStyle = () => {
    if (!gameState.isConfused) return {};
    const shake = Math.sin(Date.now() * 0.02) * 3;
    return {
      transform: `translate(${shake}px, ${shake}px)`
    };
  };

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
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          onTouchMove={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <GameUI gameState={gameState} onItemUse={onItemUse} />
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