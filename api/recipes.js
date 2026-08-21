export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { itemNames, excludeNames, diet, people, liked, disliked, craving, priorityItems, budget } = req.body || {};
    if (!itemNames) {
      return res.status(400).json({ error: 'Lista de itens não enviada' });
    }

    const exclude = Array.isArray(excludeNames) && excludeNames.length
      ? ' Não repita nenhuma destas receitas, já sugeridas antes: ' + excludeNames.join(', ') + '.'
      : '';
    const dietTxt = diet && diet !== 'nenhuma' ? ' IMPORTANTE: todas as receitas devem respeitar a restrição alimentar: ' + diet + '. Nunca sugira receita fora dessa restrição.' : '';
    const peopleTxt = people && Number(people) > 1 ? ' Ajuste as quantidades e o modo de preparo para render ' + people + ' porções.' : '';
    const likedTxt = Array.isArray(liked) && liked.length ? ' A pessoa curtiu receitas parecidas com: ' + liked.join(', ') + '. Priorize um estilo parecido quando fizer sentido.' : '';
    const dislikedTxt = Array.isArray(disliked) && disliked.length ? ' A pessoa NÃO curtiu: ' + disliked.join(', ') + '. Evite sugerir algo muito parecido com essas.' : '';
    const cravingTxt = craving ? ' IMPORTANTE: a pessoa está com vontade de comer algo relacionado a "' + craving + '". Priorize receitas que atendam esse desejo, usando o que ela tem sempre que possível.' : '';
    const priorityTxt = Array.isArray(priorityItems) && priorityItems.length ? ' URGENTE: estes itens estão prestes a vencer e PRECISAM ser usados: ' + priorityItems.join(', ') + '. TODA receita sugerida deve obrigatoriamente usar pelo menos um desses itens.' : '';
    const budgetTxt = budget ? ' IMPORTANTE: a pessoa quer gastar pouco (orçamento apertado, algo em torno de R$' + budget + ' pra repor o que falta). Priorize MUITO fortemente receitas que usem quase só o que ela já tem, com o mínimo possível de itens novos pra comprar, e evite ingredientes caros ou sofisticados.' : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: 'Tenho estes itens na geladeira: ' + itemNames + '. Sugira 15 receitas brasileiras (doces e salgadas) que se conectem com o que tenho.' + exclude + dietTxt + peopleTxt + likedTxt + dislikedTxt + cravingTxt + priorityTxt + budgetTxt + ' IMPORTANTE: nunca retorne uma lista vazia, mesmo que eu tenha poucos itens, e sempre tente retornar as 15 receitas cheias. Se eu tiver poucos itens, inclua receitas simples que usem so 1 ou 2 deles, complementando com ingredientes comuns de despensa (sal, oleo, acucar, farinha, agua, temperos basicos) que a maioria das cozinhas ja tem e por isso NAO devem entrar no campo missing. Varie bastante entre as 15: inclua receitas rapidas, receitas mais elaboradas, doces, salgadas, e receitas de inspiracao caso eu tenha poucos itens. Responda SOMENTE com um JSON valido, sem markdown, no formato: [{"name":"nome da receita","category":"salgado ou doce","time_minutes":15,"uses":["tomate","ovo"],"missing":["fuba"],"instructions":"passo a passo bem curto em 2-3 frases"}]. O campo missing deve listar so ingredientes que realmente precisam ser comprados (nao itens basicos de despensa); se a receita ja da pra fazer com o que tem, deixe missing como array vazio.'
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
