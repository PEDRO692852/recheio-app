export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  try {
    const { leftover, itemNames } = req.body || {};
    if (!leftover) {
      return res.status(400).json({ error: 'Descrição da sobra não enviada' });
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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: 'Sobrou isso de pronto de ontem: ' + leftover + '. Tambem tenho estes itens crus na geladeira: ' + (itemNames || 'nenhum') + '. Sugira 6 receitas que TRANSFORMEM essa sobra em um prato novo (nao repita o prato original, reinvente), aproveitando tambem o que tenho de itens crus se fizer sentido. Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"name":"nome do prato novo","category":"salgado ou doce","time_minutes":15,"uses":["arroz"],"missing":[],"instructions":"passo a passo bem curto em 2-3 frases"}]'
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API da Anthropic' });
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    let recipes = [];
    try { recipes = JSON.parse(clean); } catch (e) { recipes = []; }

    return res.status(200).json({ recipes: Array.isArray(recipes) ? recipes : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao pensar na sobra' });
  }
}
