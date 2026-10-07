// Confere no Mercado Pago se o pagamento com essa referência foi aprovado.
// O jogo chama isso quando o jogador clica em "Já paguei, verificar".
//
// Variável de ambiente necessária no Vercel: MERCADOPAGO_ACCESS_TOKEN

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ erro: 'Servidor sem token configurado' });

  const { referencia } = req.query;
  if (!referencia) return res.status(400).json({ erro: 'Falta a referência do pagamento' });

  try {
    const resposta = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(referencia)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const dados = await resposta.json();
    if (!resposta.ok) {
      console.error('Erro Mercado Pago:', dados);
      return res.status(502).json({ erro: 'Mercado Pago recusou a consulta', detalhe: dados });
    }

    const pagamentos = dados.results || [];
    const aprovado = pagamentos.find(p => p.status === 'approved');

    return res.status(200).json({
      aprovado: !!aprovado,
      status: aprovado ? 'approved' : (pagamentos[0]?.status || 'nao_encontrado'),
    });
  } catch (e) {
    console.error('Erro ao verificar pagamento:', e);
    return res.status(500).json({ erro: 'Falha ao falar com o Mercado Pago' });
  }
}
