export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { itemNames, diet, day } = req.body || {};
    if (!itemNames || !day) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    const dietTxt = diet && diet !== 'nenhuma' ? ' IMPORTANTE: todos os pratos devem respeitar a restrição alimentar: ' + diet + '.' : '';

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
          content: 'Tenho estes itens na geladeira: ' + itemNames + '. Monte as 3 refeicoes de ' + day + ' (cafe da manha, almoco e jantar), priorizando usar os itens que tenho.' + dietTxt + ' Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"meal":"Café da manhã","recipe":"nome do prato","time_minutes":10,"uses":["ovo"],"missing":[],"instructions":"passo a passo bem curto em 2-3 frases"},{"meal":"Almoço","recipe":"...","time_minutes":30,"uses":[],"missing":[],"instructions":"..."},{"meal":"Jantar","recipe":"...","time_minutes":20,"uses":[],"missing":[],"instructions":"..."}]. O array deve ter exatamente 3 posicoes, na ordem Café da manhã, Almoço, Jantar.'
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: (data.error && data.error.message) || 'Erro na API da Anthropic' });
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let meals = [];
    try {
      meals = JSON.parse(clean);
    } catch (e) {
      meals = [];
    }

    return res.status(200).json({ meals: Array.isArray(meals) ? meals : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao montar o plano' });
  }
}
