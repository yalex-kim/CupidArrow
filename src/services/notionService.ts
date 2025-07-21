export interface RankingEntry {
  name: string;
  score: number;
  level: number;
}

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api' 
  : '/api';

export const saveRankingToNotion = async (entry: RankingEntry): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rankings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving to Notion:', error);
    return false;
  }
};

export const getRankingsFromNotion = async (): Promise<RankingEntry[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rankings`);

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
      return [];
    }

    const rankings = await response.json();
    return rankings;
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    return [];
  }
};