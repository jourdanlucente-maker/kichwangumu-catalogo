import { Product } from '../types';

// =====================================================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// =====================================================================
const SHEET_ID_LONG = "2PACX-1vRbwfXLJyJ8VIP8fwqFZzbeV6PGJ8Ygu8IS1yVRiXG5xJq-6W9zdJGtqvUlAh4NZn6_2knlQh-WoD8c";
const PUBLISHED_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_LONG}/pub?output=csv`;

// =====================================================================
// UTILIDADES
// =====================================================================

const slugify = (text: string) => {
  if (!text) return '';
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim();
};

const cleanCurrency = (val: string) => {
  if (!val) return 0;
  const clean = val.replace(/\D/g, ''); 
  return parseInt(clean, 10) || 0;
};

// Parser de línea CSV iterativo (más seguro que Regex)
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        // Manejo básico de comillas
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    // Push del último valor
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
};

const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) throw new Error("El archivo CSV parece estar vacío.");

  let headerIndex = -1;
  let headers: string[] = [];
  
  // Buscar headers en las primeras 20 líneas
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const rowRaw = lines[i].toLowerCase();
    // Verificamos columnas clave
    if (rowRaw.includes('sku') && (rowRaw.includes('foto') || rowRaw.includes('descripción'))) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("CSV Headers no encontrados. Primeras líneas:", lines.slice(0, 3));
    throw new Error("No se encontraron las columnas 'SKU' y 'Foto' en el archivo. Verifica el Excel.");
  }

  // Parsear datos
  return lines.slice(headerIndex + 1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
};

// =====================================================================
// FETCH CATALOG
// =====================================================================

export const fetchCatalog = async (): Promise<Product[]> => {
  try {
    let text = '';
    
    // Usamos AllOrigins JSON API que es más robusto para CORS
    try {
        console.log("Fetching catalog via AllOrigins...");
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(PUBLISHED_URL)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        
        const json = await response.json();
        if (json.contents) {
            text = json.contents;
        } else {
            throw new Error("Respuesta vacía del proxy.");
        }
    } catch (e) {
        console.warn("Proxy falló, intentando directo...", e);
        // Fallback directo
        const response = await fetch(PUBLISHED_URL);
        if (!response.ok) throw new Error(`Direct HTTP ${response.status}`);
        text = await response.text();
    }

    if (!text || text.length < 50) {
       throw new Error("El contenido del archivo es inválido o está vacío.");
    }

    const rows = parseCSV(text);
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
      // Flexibilidad en nombres de columna
      const rawName = row['foto'] || row['descripción foto'] || row['descripcion foto']; 
      const sku = row['sku'] || row['código (sku)'];

      if (!rawName || !sku) return;

      const productId = slugify(rawName);
      
      if (!productMap.has(productId)) {
        const isFeline = ['leon', 'león', 'leona', 'guepardo', 'leopardo', 'tigre', 'gato', 'felino', 'cheetah'].some(x => rawName.toLowerCase().includes(x));
        
        productMap.set(productId, {
          id: productId,
          name: rawName,
          imageUrl: `/photos/${rawName}.jpg`, 
          isFeline,
          variants: []
        });
      }

      const product = productMap.get(productId)!;
      
      // Mapeo de columnas de precio con variantes comunes
      const pImp = cleanCurrency(row['pvp imp'] || row['pvp impresion'] || row['precio unitario'] || row['costo imp']); 
      const pMarco = cleanCurrency(row['pvp marco']);
      const pAr = cleanCurrency(row['pvp ar'] || row['pvp antireflejo']);

      // Solo agregamos si hay datos válidos
      if (pImp > 0 || pMarco > 0) {
        product.variants.push({
          sku: sku,
          versionName: row['versión'] || row['version'] || 'Estándar',
          dimensions: row['medidas'] || row['tamaño cm'] || 'N/A',
          isBig: (row['esgrande'] === '1' || String(row['esgrande']).toLowerCase() === 'true'),
          prices: {
            imp: pImp,
            marco: pMarco,
            ar: pAr
          }
        });
      }
    });

    const result = Array.from(productMap.values());
    console.log(`Catálogo cargado: ${result.length} productos.`);
    
    if (result.length === 0) {
      throw new Error("No se encontraron productos válidos. Revisa el nombre de las pestañas/columnas en Google Sheets.");
    }

    return result;

  } catch (error) {
    console.error("Error en fetchCatalog:", error);
    throw error;
  }
};