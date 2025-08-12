import React from 'react';
import { GameState } from '../game/GameEngine';

interface GameUIProps {
  gameState: GameState;
  onItemUse: (itemType: 'shield' | 'speed') => void;
}

export const GameUI: React.FC<GameUIProps> = ({ gameState, onItemUse }) => {
  const { lives, score, level, items } = gameState;

  return (
    <>
      {/* Game Stats UI */}
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

      {/* Mobile Item Controls */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 60
      }}>
        <button
          onClick={() => onItemUse('shield')}
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
          onClick={() => onItemUse('speed')}
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
    </>
  );
};