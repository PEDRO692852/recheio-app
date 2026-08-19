export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { itemNames } = req.body || {};
    if (!itemNames) {
      return res.status(400).json({ error: 'Lista de itens não enviada' });
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
          content: 'Tenho estes itens na geladeira: ' + itemNames + '. Monte um plano de jantar para os 7 dias da semana (Segunda a Domingo), priorizando usar os itens que tenho. Pode repetir pratos parecidos se fizer sentido para não desperdiçar. Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"day":"Segunda","recipe":"nome do prato","time_minutes":20,"missing":["item que falta"]}]. O array deve ter exatamente 7 posicoes, uma para cada dia da semana, comecando em Segunda.'
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API da Anthropic' });
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let plan = [];
    try {
      plan = JSON.parse(clean);
    } catch (e) {
      plan = [];
    }

    return res.status(200).json({ plan: Array.isArray(plan) ? plan : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao montar o plano' });
  }
}
