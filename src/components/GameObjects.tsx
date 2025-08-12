import React from 'react';
import { GameState } from '../game/GameEngine';

interface GameObjectsProps {
  gameState: GameState;
}

const PLAYER_SIZE = 50;
const ARROW_SIZE = 12;

export const GameObjects: React.FC<GameObjectsProps> = ({ gameState }) => {
  const { player, arrows, confusionItems, slowItems, speedTrails, items, isInvincible } = gameState;

  return (
    <>
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

      {/* Arrows */}
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

      {/* Confusion Items */}
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

      {/* Slow Items */}
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
            left: trail.x - PLAYER_SIZE / 2,
            top: trail.y - PLAYER_SIZE / 2,
            fontSize: '50px',
            opacity: trail.opacity * 0.5,
            color: '#60a5fa',
            textShadow: '0 0 5px #60a5fa',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          🏃
        </div>
      ))}
    </>
  );
};