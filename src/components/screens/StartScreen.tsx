import React from 'react';

interface StartScreenProps {
  onStartGame: () => void;
  onShowRankings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onShowRankings }) => {
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
          onClick={onStartGame}
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
          onClick={onShowRankings}
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
};