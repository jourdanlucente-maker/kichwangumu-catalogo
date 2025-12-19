import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Falta MP_ACCESS_TOKEN");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const { total, description } = req.body;

    // Validación estricta para Producción
    if (!total || isNaN(Number(total)) || Number(total) <= 0) {
       return res.status(400).json({ error: 'El monto total es inválido.' });
    }

    const origin = req.headers.origin || 'https://kichwangumu-catalogo.vercel.app';
    const cleanDesc = description ? String(description).substring(0, 250) : "Compra Kichwa Ngumu";

    // Crear preferencia
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pedido-kichwa',
            title: cleanDesc,
            quantity: 1,
            unit_price: Number(total), // Asegurar que sea número
            currency_id: 'CLP'
          }
        ],
        back_urls: {
          success: `${origin}/#/cart?status=success`,
          failure: `${origin}/#/cart?status=failure`,
          pending: `${origin}/#/cart?status=pending`
        },
        auto_return: 'approved',
        statement_descriptor: "KICHWA NGUMU"
      }
    });

    return res.status(200).json({ url: result.init_point });
  } catch (error) {
    console.error("Error MP:", error);
    return res.status(500).json({ error: error.message });
  }
}