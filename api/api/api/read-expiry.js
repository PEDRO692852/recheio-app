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
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: 'Essa é a foto de uma embalagem de alimento. Encontre a data de validade impressa (pode estar escrito "val", "venc", "consumir antes de", etc). Responda SOMENTE com um JSON valido, sem markdown: {"found": true, "expiryDate": "AAAA-MM-DD"} ou {"found": false} se não conseguir ler nenhuma data com confiança. Nunca invente uma data.' }
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
    let result = { found: false };
    try { result = JSON.parse(clean); } catch (e) { result = { found: false }; }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao ler validade' });
  }
}
