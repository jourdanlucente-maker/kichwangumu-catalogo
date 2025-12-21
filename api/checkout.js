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
    const { total, description, items } = req.body; // 'items' es el array detallado que ahora enviamos

    // Validación estricta
    if (!total || isNaN(Number(total)) || Number(total) <= 0) {
       return res.status(400).json({ error: 'El monto total es inválido.' });
    }

    const origin = req.headers.origin || 'https://kichwangumu-catalogo.vercel.app';
    
    // 1. CONSTRUIR TÍTULO DETALLADO
    // Si viene el array de items, construimos un string bonito. Si no (compatibilidad), usamos description.
    let titleToUse = description ? String(description).substring(0, 250) : "Compra Kichwa Ngumu";
    
    if (items && Array.isArray(items) && items.length > 0) {
        // Formato: "Leon 60x90(Imp), Jirafa 30x40(Marco)..."
        const details = items.map(i => {
            const mat = i.material === 'imp' ? 'Imp' : (i.material === 'marco' ? 'Marco' : 'AR');
            return `${i.productName} ${i.dimensions}(${mat})`;
        }).join(', ');
        
        // MercadoPago a veces corta títulos muy largos, pero 250 caracteres suele ser suficiente para 3-4 obras.
        titleToUse = details.substring(0, 254);
    }

    // 2. METADATA (Respaldar toda la data en formato JSON oculto)
    const metadata = {
        full_items: items ? JSON.stringify(items) : "[]",
        original_desc: description
    };

    // Crear preferencia
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pedido-kichwa',
            title: titleToUse, // <--- AQUÍ ESTÁ EL TRUCO: El título detallado va al correo de MP
            quantity: 1,
            unit_price: Number(total), 
            currency_id: 'CLP',
            description: titleToUse // Repetimos en descripción por seguridad
          }
        ],
        metadata: metadata, // Data técnica oculta
        back_urls: {
          success: `${origin}/#/cart?status=success`,
          failure: `${origin}/#/cart?status=failure`,
          pending: `${origin}/#/cart?status=pending`
        },
        auto_return: 'approved',
        statement_descriptor: "KICHWA NGUMU",
        // Pedir datos al pagador en el checkout de MP (Nombre, Email y Teléfono son obligatorios usualmente)
        payer: {
            phone: {},
            identification: {},
            address: {}
        },
        binary_mode: true // Solo Aprobado o Rechazado (evita pendientes eternos a veces)
      }
    });

    return res.status(200).json({ url: result.init_point });
  } catch (error) {
    console.error("Error MP:", error);
    return res.status(500).json({ error: error.message });
  }
}