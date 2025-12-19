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
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim();
};

const cleanCurrency = (val: string) => {
  if (!val) return 0;
  // Elimina todo lo que no sea dígito. 
  // Ejemplo: "$ 8.900" -> "8900". "1.000.000" -> "1000000"
  const clean = val.replace(/\D/g, ''); 
  return parseInt(clean, 10) || 0;
};

// Parser robusto que busca la fila de encabezados
const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) throw new Error("El archivo CSV parece estar vacío (menos de 2 líneas).");

  // 1. Buscar la fila de encabezados
  let headerIndex = -1;
  let headers: string[] = [];
  
  // Buscamos en las primeras 10 líneas alguna que contenga 'sku' y 'foto'
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    // Limpieza básica de la línea para detectar headers
    const rowRaw = lines[i].toLowerCase();
    if (rowRaw.includes('sku') && rowRaw.includes('foto')) {
      headerIndex = i;
      // Parseamos esta línea como headers
      headers = lines[i].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("CSV Headers no encontrados. Primeras líneas:", lines.slice(0, 3));
    throw new Error("No se encontraron las columnas 'SKU' y 'Foto' en el archivo. Verifica el Excel.");
  }

  // 2. Parsear datos usando esos headers
  const data = lines.slice(headerIndex + 1).map(line => {
    // Regex para respetar comas dentro de comillas
    const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
    const values: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1] : match[2];
      values.push(val ? val.trim() : '');
    }
    
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      // Normalizar claves a minúsculas para evitar errores por "Foto " vs "Foto"
      obj[h] = values[i] || '';
    });
    return obj;
  });

  return data;
};

// =====================================================================
// FETCH CATALOG
// =====================================================================

export const fetchCatalog = async (): Promise<Product[]> => {
  try {
    let text = '';
    let usedProxy = false;
    
    // Intento 1: Directo
    try {
        console.log("Intentando conexión directa...");
        const response = await fetch(PUBLISHED_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = await response.text();
    } catch (e) {
        console.warn("Conexión directa falló, intentando proxy corsproxy.io...", e);
        // Intento 2: Proxy corsproxy.io (Más estable para Google Sheets)
        usedProxy = true;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(PUBLISHED_URL)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        text = await response.text();
    }

    if (!text || text.length < 50) {
       throw new Error("El archivo recibido está vacío o es inválido.");
    }

    const rows = parseCSV(text);
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
      // Usamos keys en minúscula gracias al parser normalizado
      const rawName = row['foto']; 
      const sku = row['sku'];

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
      // Mapeo flexible de columnas (busca variantes comunes)
      const pImp = cleanCurrency(row['pvp imp'] || row['pvp impresion'] || row['precio imp']);
      const pMarco = cleanCurrency(row['pvp marco'] || row['precio marco']);
      const pAr = cleanCurrency(row['pvp ar'] || row['pvp antireflejo'] || row['precio ar']);

      if (pImp > 0) {
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
    console.log(`Catálogo cargado: ${result.length} productos procesados.`);
    
    if (result.length === 0) {
      throw new Error("Se leyó el archivo pero no se encontraron variantes válidas (Revisar nombres de columnas: 'Foto', 'SKU', 'PVP Imp').");
    }

    return result;

  } catch (error) {
    console.error("Falla FATAL cargando catálogo:", error);
    // Propagamos el error para que la UI lo muestre
    throw error;
  }
};

export const getAllProducts = (): Product[] => []; 
export const getProductById = (id: string): Product | undefined => undefined;