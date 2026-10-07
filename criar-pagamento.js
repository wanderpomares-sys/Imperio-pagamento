// Cria uma preferência de pagamento no Mercado Pago e devolve o link de checkout.
// Variável de ambiente necessária no Vercel: MERCADOPAGO_ACCESS_TOKEN
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ erro: 'Servidor sem token configurado' });

  const referencia = `sede3_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{
          id: 'desbloqueio-sede3',
          title: 'Império das Máquinas — Desbloqueio Sede 3+',
          description: 'Libera a 3ª sede em diante, permanentemente.',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 9.90,
        }],
        external_reference: referencia,
        back_urls: {
          success: 'https://wanderpomares-sys.github.io/ImperioDasMaquinas/?pagamento=sucesso',
          failure: 'https://wanderpomares-sys.github.io/ImperioDasMaquinas/?pagamento=falha',
          pending: 'https://wanderpomares-sys.github.io/ImperioDasMaquinas/?pagamento=pendente',
        },
        auto_return: 'approved',
      }),
    });

    const dados = await resposta.json();
    if (!resposta.ok) {
      console.error('Erro Mercado Pago:', dados);
      return res.status(502).json({ erro: 'Mercado Pago recusou a criação do link', detalhe: dados });
    }

    return res.status(200).json({ linkPagamento: dados.init_point, referencia });
  } catch (e) {
    console.error('Erro ao criar preferência:', e);
    return res.status(500).json({ erro: 'Falha ao falar com o Mercado Pago' });
  }
};
