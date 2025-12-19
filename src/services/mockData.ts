import { Product } from '../types';

// =====================================================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// =====================================================================
// Usamos el ID exacto que proporcionaste.
// Transformamos el link 'pubhtml' a 'pub?output=csv' para poder leer los datos.
const PUBLISHED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbwfXLJyJ8VIP8fwqFZzbeV6PGJ8Ygu8IS1yVRiXG5xJq-6W9zdJGtqvUlAh4NZn6_2knlQh-WoD8c/pub?output=csv";

// =====================================================================
// UTILIDADES
// =====================================================================

const slugify = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim();
};

const parseCSV = (text: string) => {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
    const values: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1] : match[2];
      values.push(val ? val.trim() : '');
    }
    
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
};

const cleanCurrency = (val: string) => {
  if (!val) return 0;
  const clean = val.replace(/[$,\.]/g, ''); 
  return parseInt(clean, 10) || 0;
};

// =====================================================================
// FETCH CATALOG
// =====================================================================

export const fetchCatalog = async (): Promise<Product[]> => {
  try {
    let text = '';
    
    // 1. Intentar fetch directo (más rápido)
    try {
        const response = await fetch(PUBLISHED_URL);
        if (response.ok) {
            text = await response.text();
        } else {
            throw new Error('Direct fetch failed');
        }
    } catch (e) {
        // 2. Intentar fetch vía Proxy (para evitar bloqueos CORS)
        console.warn("Conexión directa falló, intentando proxy...");
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(PUBLISHED_URL)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy fetch failed');
        text = await response.text();
    }

    const rows = parseCSV(text);
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
      if (!row['Foto'] || !row['SKU']) return;

      const name = row['Foto'];
      const productId = slugify(name);
      
      if (!productMap.has(productId)) {
        const isFeline = ['leon', 'león', 'leona', 'guepardo', 'leopardo', 'tigre', 'gato', 'felino', 'cheetah'].some(x => name.toLowerCase().includes(x));
        
        productMap.set(productId, {
          id: productId,
          name: name,
          imageUrl: `/photos/${name}.jpg`, 
          isFeline,
          variants: []
        });
      }

      const product = productMap.get(productId)!;
      const pImp = cleanCurrency(row['PVP Imp']);
      const pMarco = cleanCurrency(row['PVP Marco']);
      const pAr = cleanCurrency(row['PVP AR']);

      if (pImp > 0) {
        product.variants.push({
          sku: row['SKU'],
          versionName: row['Versión'] || 'Estándar',
          dimensions: row['Medidas'] || 'N/A',
          isBig: (row['EsGrande'] === '1' || row['EsGrande'] === 'TRUE'),
          prices: {
            imp: pImp,
            marco: pMarco,
            ar: pAr
          }
        });
      }
    });

    return Array.from(productMap.values());

  } catch (error) {
    console.error("Falla cargando catálogo:", error);
    return [];
  }
};

export const getAllProducts = (): Product[] => []; 
export const getProductById = (id: string): Product | undefined => undefined;