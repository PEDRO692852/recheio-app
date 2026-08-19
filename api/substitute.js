export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { missing, have } = req.body || {};
    if (!missing || !Array.isArray(missing) || missing.length === 0) {
      return res.status(400).json({ error: 'Ingredientes faltantes não enviados' });
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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: 'Estes ingredientes estao faltando numa receita: ' + missing.join(', ') + '. A pessoa tem em casa: ' + (have && have.length ? have.join(', ') : 'poucos itens') + '. Para cada ingrediente faltante, sugira 1 substituto simples e comum (pode ser algo que ela ja tem, ou algo facil de achar). Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"ingredient":"fuba","substitute":"farinha de trigo (textura fica um pouco diferente)"}]'
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API da Anthropic' });
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let subs = [];
    try {
      subs = JSON.parse(clean);
    } catch (e) {
      subs = [];
    }

    return res.status(200).json({ substitutes: Array.isArray(subs) ? subs : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao buscar substitutos' });
  }
}
