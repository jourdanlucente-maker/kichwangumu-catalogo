import { MercadoPagoConfig, Preference } from 'mercadopago';

// Vercel Serverless Function
// Esta función corre en el servidor de Vercel, protegiendo tu Token
export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde tu web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejo de preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtenemos el token desde las variables de entorno de Vercel
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Falta configurar MP_ACCESS_TOKEN en Vercel");
    }

    // Inicializamos MP
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const { total, description } = req.body;

    // Detectamos la URL de origen (tu dominio en Vercel)
    // Esto asegura que al terminar el pago, MP devuelva al usuario a la web correcta
    const origin = req.headers.origin || 'https://kichwangumu-catalogo.vercel.app';
    const returnUrl = `${origin}/#/cart`; 

    const preference = new Preference(client);

    // Creamos la preferencia de pago
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pedido-kichwa-ngumu',
            title: description || 'Pedido Kichwa Ngumu',
            quantity: 1,
            unit_price: Number(total),
            currency_id: 'CLP'
          }
        ],
        // Definimos a dónde vuelve el usuario según el resultado
        back_urls: {
          success: returnUrl,
          failure: returnUrl,
          pending: returnUrl
        },
        auto_return: 'approved', // Retorno automático si se aprueba
      }
    });

    // Respondemos al frontend con la URL de pago
    return res.status(200).json({ url: result.init_point });
    
  } catch (error) {
    console.error("Error Mercado Pago:", error);
    return res.status(500).json({ error: 'Error al generar link de pago' });
  }
}