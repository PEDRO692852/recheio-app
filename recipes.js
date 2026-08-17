export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { itemNames, excludeNames } = req.body || {};
    if (!itemNames) {
      return res.status(400).json({ error: 'Lista de itens não enviada' });
    }

    const exclude = Array.isArray(excludeNames) && excludeNames.length
      ? ' Não repita nenhuma destas receitas, já sugeridas antes: ' + excludeNames.join(', ') + '.'
      : '';

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
          content: 'Tenho estes itens na geladeira: ' + itemNames + '. Sugira 6 receitas brasileiras (doces e salgadas) que se conectem com o que tenho.' + exclude + ' IMPORTANTE: nunca retorne uma lista vazia, mesmo que eu tenha poucos itens. Se eu tiver poucos itens, inclua receitas simples que usem so 1 ou 2 deles, complementando com ingredientes comuns de despensa (sal, oleo, acucar, farinha, agua, temperos basicos) que a maioria das cozinhas ja tem e por isso NAO devem entrar no campo missing. Priorize receitas que aproveitem mais itens quando possivel, mas sempre inclua tambem algumas receitas de inspiracao mais simples caso eu tenha poucos itens. Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"name":"nome da receita","category":"salgado ou doce","time_minutes":15,"uses":["tomate","ovo"],"missing":["fuba"],"instructions":"passo a passo curto em 3-5 frases"}]. O campo missing deve listar so ingredientes que realmente precisam ser comprados (nao itens basicos de despensa); se a receita ja da pra fazer com o que tem, deixe missing como array vazio.'
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
    try {
      recipes = JSON.parse(clean);
    } catch (e) {
      recipes = [];
    }

    return res.status(200).json({ recipes: Array.isArray(recipes) ? recipes : [] });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno ao gerar receitas' });
  }
}
