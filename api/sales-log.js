import { MercadoPagoConfig, Payment } from 'mercadopago';

export default async function handler(req, res) {
  // Configurar respuesta HTML limpia
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).send('<h1>Error: Falta configurar MP_ACCESS_TOKEN en Vercel</h1>');
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const payment = new Payment(client);

    // Buscar últimos 50 pagos aprobados
    const searchResult = await payment.search({
      options: {
        sort: 'date_created',
        criteria: 'desc',
        limit: 50,
        status: 'approved'
      }
    });

    const pagos = searchResult.results || [];

    // Construir reporte HTML estilo "Sherlock Holmes"
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Ventas Recuperado</title>
      <style>
        body { font-family: monospace; background: #0b0c10; color: #66fcf1; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { border-bottom: 2px solid #45a29e; padding-bottom: 10px; }
        .card { background: #1f2833; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #45a29e; }
        .header { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em; color: white; }
        .meta { color: #c5c6c7; margin: 5px 0 15px 0; font-size: 0.9em; }
        ul { background: #0b0c10; padding: 15px; border-radius: 4px; list-style: none; margin: 0; }
        li { padding: 5px 0; border-bottom: 1px solid #1f2833; color: white; display: flex; justify-content: space-between; }
        li:last-child { border-bottom: none; }
        .price { color: #66fcf1; font-weight: bold; }
        .total { text-align: right; font-size: 1.5em; margin-top: 10px; color: white; }
      </style>
    </head>
    <body>
      <h1>🕵️ Reporte Forense de Ventas (Mercado Pago)</h1>
      <p>Recuperando las últimas 50 transacciones aprobadas directamente desde los servidores de Mercado Pago...</p>
    `;

    if (pagos.length === 0) {
      html += `<h3>No se encontraron pagos aprobados recientes.</h3>`;
    }

    pagos.forEach(p => {
      const items = p.additional_info?.items || [];
      const fecha = new Date(p.date_created).toLocaleString('es-CL');
      
      html += `
        <div class="card">
          <div class="header">
            <span>${p.payer.email || 'Email Desconocido'}</span>
            <span>ID: ${p.id}</span>
          </div>
          <div class="meta">
            Fecha: ${fecha} <br/>
            Estado: ${p.status.toUpperCase()} | Desc: ${p.description || 'Sin descripción'}
          </div>
          
          <ul>
            ${items.length > 0 
              ? items.map(i => `
                  <li>
                    <span>${i.title} ${i.description ? `(${i.description})` : ''} x${i.quantity}</span>
                    <span class="price">$${Number(i.unit_price).toLocaleString('es-CL')}</span>
                  </li>
                `).join('')
              : '<li style="color:orange">⚠️ No hay detalle de ítems guardado en MP (Posible pago genérico)</li>'
            }
          </ul>
          
          <div class="total">
            Total Pagado: $${Number(p.transaction_amount).toLocaleString('es-CL')}
          </div>
        </div>
      `;
    });

    html += `</body></html>`;
    return res.status(200).send(html);

  } catch (error) {
    console.error(error);
    return res.status(500).send(`<h1 style="color:red">Error recuperando datos</h1><pre>${error.message}</pre>`);
  }
}