export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { image, mediaType } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Imagem não enviada' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: 'Liste os alimentos e itens visiveis nesta foto de geladeira. Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"name":"tomate","qty":"4 unidades"}]. Se nao conseguir identificar nada com confianca, responda [].' }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API da Anthropic' });
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let items = [];
    try {
      items = JSON.parse(clean);
    } catch (e) {
      items = [];
    }

    return res.status(200).json({ items: Array.isArray(items) ? items : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao identificar itens' });
  }
}
