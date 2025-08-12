import React from 'react';

interface NameInputScreenProps {
  finalScore: number;
  level: number;
  playerName: string;
  isLoadingRankings: boolean;
  onPlayerNameChange: (name: string) => void;
  onSubmitRanking: () => void;
  onShowRankings: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const NameInputScreen: React.FC<NameInputScreenProps> = ({
  finalScore,
  level,
  playerName,
  isLoadingRankings,
  onPlayerNameChange,
  onSubmitRanking,
  onShowRankings,
  onKeyPress
}) => {
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
            onChange={(e) => onPlayerNameChange(e.target.value)}
            onKeyPress={onKeyPress}
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
          onClick={onSubmitRanking}
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
          onClick={onShowRankings}
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
};