import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  console.log(`[API] Recibida solicitud: ${req.method}`);

  // 1. CORS Pre-flight
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Validación de Token
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[API] Error: MP_ACCESS_TOKEN no configurado en Vercel");
    return res.status(500).json({ error: 'Server Config Error: Token missing' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const { total, description } = req.body;

    // Validación básica de datos
    if (!total || isNaN(total)) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    // URL de retorno (Frontend)
    const origin = req.headers.origin || 'https://kichwangumu-catalogo.vercel.app';
    const backUrl = `${origin}/#/cart?status=approved`; 

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pedido-kichwa-ngumu',
            title: description || 'Fotografía Fine Art',
            quantity: 1,
            unit_price: Number(total),
            currency_id: 'CLP'
          }
        ],
        back_urls: {
          success: backUrl,
          failure: `${origin}/#/cart?status=failure`,
          pending: `${origin}/#/cart?status=pending`
        },
        auto_return: 'approved',
      }
    });

    console.log("[API] Preferencia creada:", result.init_point);
    return res.status(200).json({ url: result.init_point });
    
  } catch (error) {
    console.error("[API] Error MercadoPago:", error);
    return res.status(500).json({ error: 'Error interno al crear pago', details: error.message });
  }
}