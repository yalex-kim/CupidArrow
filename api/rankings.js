const NOTION_API_URL = 'https://api.notion.com/v1';

export default async function handler(req, res) {
  const API_KEY = process.env.VITE_NOTION_API_KEY;
  const DATABASE_ID = process.env.VITE_NOTION_DATABASE_ID;

  if (!API_KEY || !DATABASE_ID) {
    return res.status(500).json({ error: 'Missing Notion API credentials' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { name, score, level } = req.body;

      const response = await fetch(`${NOTION_API_URL}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: {
            database_id: DATABASE_ID,
          },
          properties: {
            'Player Name': {
              title: [
                {
                  text: {
                    content: name,
                  },
                },
              ],
            },
            'Score': {
              number: score,
            },
            'Level': {
              number: level,
            },
            'Date': {
              date: {
                start: new Date().toISOString(),
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion API Error:', response.status, error);
        return res.status(response.status).json({ error });
      }

      // After saving new ranking, keep only top 10 rankings
      const allRankings = await fetch(`${NOTION_API_URL}/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'Score',
              direction: 'descending',
            },
          ],
        }),
      });

      if (allRankings.ok) {
        const data = await allRankings.json();
        if (data.results.length > 10) {
          const recordsToDelete = data.results.slice(10);
          
          for (const record of recordsToDelete) {
            await fetch(`${NOTION_API_URL}/pages/${record.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
              },
              body: JSON.stringify({
                archived: true,
              }),
            });
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const response = await fetch(`${NOTION_API_URL}/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'Score',
              direction: 'descending',
            },
          ],
          page_size: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Notion API Error:', response.status, error);
        return res.status(response.status).json({ error });
      }

      const data = await response.json();

      const rankings = data.results.map((page) => ({
        name: page.properties['Player Name']?.title?.[0]?.text?.content || '',
        score: page.properties['Score']?.number || 0,
        level: page.properties['Level']?.number || 1,
      }));

      res.json(rankings);
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}