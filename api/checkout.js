import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  console.log(`[API V3] Request recibido: ${req.method} en ${req.url}`);

  // Configuración CORS manual y agresiva
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', received: req.method });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Falta MP_ACCESS_TOKEN");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const { total, description } = req.body;

    const origin = req.headers.origin || 'https://kichwangumu-catalogo.vercel.app';
    
    // Crear preferencia
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pedido-kichwa',
            title: description,
            quantity: 1,
            unit_price: Number(total),
            currency_id: 'CLP'
          }
        ],
        back_urls: {
          success: `${origin}/#/cart?status=success`,
          failure: `${origin}/#/cart?status=failure`,
          pending: `${origin}/#/cart?status=pending`
        },
        auto_return: 'approved'
      }
    });

    return res.status(200).json({ url: result.init_point });
  } catch (error) {
    console.error("Error MP:", error);
    return res.status(500).json({ error: error.message });
  }
}