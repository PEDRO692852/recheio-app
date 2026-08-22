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
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: 'Essa é a foto de um recibo/nota fiscal de mercado. Leia a lista de produtos comprados e identifique quais são ALIMENTOS ou ingredientes de cozinha (ignore itens de limpeza, higiene, ou outros não-alimentícios). Traduza nomes de produto abreviados/em caixa alta pra um nome comum reconhecível (ex: "TOM ITALIANO KG" vira "tomate", "LEITE INT 1L" vira "leite"). Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"name":"tomate","qty":"1"}]. Se não conseguir ler nada com confiança, responda [].' }
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
    try { items = JSON.parse(clean); } catch (e) { items = []; }

    return res.status(200).json({ items: Array.isArray(items) ? items : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao ler o recibo' });
  }
}
