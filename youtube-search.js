export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { query } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: 'Busca não enviada' });
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '1',
      q: query,
      relevanceLanguage: 'pt',
      safeSearch: 'strict',
      key: process.env.YOUTUBE_API_KEY
    });

    const response = await fetch('https://www.googleapis.com/youtube/v3/search?' + params.toString());
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API do YouTube' });
    }

    const items = data.items || [];
    const videoId = items.length > 0 && items[0].id ? items[0].id.videoId : null;

    return res.status(200).json({ videoId: videoId || null });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao buscar vídeo' });
  }
}
