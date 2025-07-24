export interface RankingEntry {
  name: string;
  score: number;
  level: number;
}

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'https://cupid-arrow.vercel.app/api';

export const saveRankingToNotion = async (entry: RankingEntry): Promise<boolean> => {
  try {
    console.log('Saving to API:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/rankings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, response.statusText, error);
      alert(`랭킹 저장 실패: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log('Ranking saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving to Notion:', error);
    alert(`네트워크 오류: ${error}`);
    return false;
  }
};

export const getRankingsFromNotion = async (): Promise<RankingEntry[]> => {
  try {
    console.log('Fetching from API:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/rankings`);

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, response.statusText, error);
      return [];
    }

    const rankings = await response.json();
    console.log('Rankings fetched:', rankings.length, 'entries');
    return rankings;
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    return [];
  }
};