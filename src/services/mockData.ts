import { Product } from '../types';

// =====================================================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// =====================================================================
const SHEET_ID_LONG = "2PACX-1vRbwfXLJyJ8VIP8fwqFZzbeV6PGJ8Ygu8IS1yVRiXG5xJq-6W9zdJGtqvUlAh4NZn6_2knlQh-WoD8c";
const PUBLISHED_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_LONG}/pub?output=csv`;
const CACHE_KEY = 'kichwa_catalog_cache_v1';

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

const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
};

const parseCSV = (text: string) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) throw new Error("El archivo CSV parece estar vacío.");

  let headerIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const rowRaw = lines[i].toLowerCase();
    if (rowRaw.includes('sku') && (rowRaw.includes('foto') || rowRaw.includes('descripción'))) {
      headerIndex = i;
      headers = parseCSVLine(lines[i]).map(h => h.toLowerCase());
      break;
    }
  }

  if (headerIndex === -1) {
    console.error("CSV Headers no encontrados. Primeras líneas:", lines.slice(0, 3));
    throw new Error("No se encontraron las columnas 'SKU' y 'Foto'.");
  }

  return lines.slice(headerIndex + 1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
};

// Helper para reintentos con timeout
const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
};

// =====================================================================
// FETCH CATALOG (ROBUST MODE)
// =====================================================================

export const fetchCatalog = async (): Promise<Product[]> => {
  try {
    let text = '';
    let loadedFrom = '';

    // ESTRATEGIA DE CARGA:
    // 1. Directo Google
    // 2. Proxy 1 (AllOrigins)
    // 3. Proxy 2 (CorsProxy)
    // 4. Caché Local (Fallback)

    try {
        console.log("Intentando carga directa...");
        const res = await fetchWithTimeout(PUBLISHED_URL, 4000);
        if (!res.ok) throw new Error("Direct failed");
        text = await res.text();
        loadedFrom = 'Direct';
    } catch (e) {
        console.warn("Fallo directo, intentando Proxy 1...", e);
        try {
            const proxy1 = `https://api.allorigins.win/get?url=${encodeURIComponent(PUBLISHED_URL)}`;
            const res = await fetchWithTimeout(proxy1, 6000);
            const json = await res.json();
            if (json.contents) text = json.contents;
            loadedFrom = 'Proxy1';
        } catch (e2) {
            console.warn("Fallo Proxy 1, intentando Proxy 2...", e2);
            try {
                const proxy2 = `https://corsproxy.io/?${encodeURIComponent(PUBLISHED_URL)}`;
                const res = await fetchWithTimeout(proxy2, 6000);
                text = await res.text();
                loadedFrom = 'Proxy2';
            } catch (e3) {
                 console.warn("Fallaron todas las redes. Intentando caché local...", e3);
            }
        }
    }

    // Si falló la red, intentar cargar desde caché
    if (!text || text.length < 50) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            console.log("Cargando desde caché local de emergencia.");
            text = cached;
            loadedFrom = 'LocalStorage Cache';
        } else {
            throw new Error("No se pudo conectar a la hoja de cálculo y no hay datos en caché.");
        }
    } else {
        // Si descargamos datos frescos válidos, actualizamos el caché
        if (text.length > 200) {
            localStorage.setItem(CACHE_KEY, text);
        }
    }

    const rows = parseCSV(text);
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
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
      
      const pImp = cleanCurrency(row['pvp imp'] || row['pvp impresion'] || row['precio unitario'] || row['costo imp']); 
      const pMarco = cleanCurrency(row['pvp marco']);
      // Ignoramos AR visualmente, pero si viene en el excel lo leemos por si acaso, aunque UI no lo muestra
      const pAr = cleanCurrency(row['pvp ar'] || row['pvp antireflejo']);

      if (pImp > 0) {
        product.variants.push({
          sku: sku,
          versionName: row['versión'] || row['version'] || 'Estándar',
          dimensions: row['medidas'] || row['tamaño cm'] || 'N/A',
          isBig: (row['esgrande'] === '1' || String(row['esgrande']).toLowerCase() === 'true'),
          prices: {
            imp: pImp,
            marco: pMarco > 0 ? pMarco : 0,
            ar: pAr > 0 ? pAr : 0
          }
        });
      }
    });

    const result = Array.from(productMap.values());
    console.log(`Catálogo cargado vía ${loadedFrom}: ${result.length} productos.`);
    
    if (result.length === 0) {
      throw new Error("Datos vacíos.");
    }

    return result;

  } catch (error) {
    console.error("Error crítico en fetchCatalog:", error);
    throw error;
  }
};