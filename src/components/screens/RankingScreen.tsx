import React from 'react';
import type { RankingEntry } from '../../services/notionService';

interface RankingScreenProps {
  rankings: RankingEntry[];
  finalScore: number;
  isCapturing: boolean;
  onCaptureAndShare: () => void;
  onShareGameLink: () => void;
  onStartGame: () => void;
  onShowStart: () => void;
  rankingRef: React.RefObject<HTMLDivElement>;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({
  rankings,
  finalScore,
  isCapturing,
  onCaptureAndShare,
  onShareGameLink,
  onStartGame,
  onShowStart,
  rankingRef
}) => {
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
                backgroundColor: entry.score === finalScore ? '#fef3c7' : 'white',
                border: entry.score === finalScore ? '2px solid #fbbf24' : '1px solid #d1d5db'
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
            최종 점수: {finalScore}점
          </p>
          
          <div style={{ 
            position: 'absolute',
            right: 0,
            top: '12px',
            display: 'flex', 
            gap: '8px' 
          }}>
            <button 
              onClick={onCaptureAndShare}
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
              onClick={onShareGameLink}
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
            onClick={onStartGame}
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
            onClick={onShowStart}
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
};