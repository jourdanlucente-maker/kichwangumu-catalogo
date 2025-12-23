import { Product } from '../types';

// =====================================================================
// CONFIGURACIÓN
// =====================================================================
const SHEET_ID_LONG = "2PACX-1vRbwfXLJyJ8VIP8fwqFZzbeV6PGJ8Ygu8IS1yVRiXG5xJq-6W9zdJGtqvUlAh4NZn6_2knlQh-WoD8c";
const PUBLISHED_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID_LONG}/pub?output=csv`;
const CACHE_KEY = 'kichwa_catalog_cache_v2'; // Incrementamos versión caché

// =====================================================================
// DATOS DE RESPALDO (FALLBACK)
// Estos se usarán si falla la conexión a Google Sheets.
// =====================================================================
const FALLBACK_RAW_DATA = [
  {
    id: "abuela-masai", name: "ABUELA MASÁI", imageUrl: "/photos/ABUELA MASÁI.jpg", isFeline: false,
    variants: [
      { sku: "ABU_MAS_50x62.5", versionName: "Original", dimensions: "50x62.5", isBig: true, prices: { imp: 78000, marco: 168000, ar: 218400 } },
      { sku: "ABU_MAS_40x50", versionName: "Std 4:5", dimensions: "40x50", isBig: false, prices: { imp: 48000, marco: 130000, ar: 169000 } }
    ]
  },
  {
    id: "leopardo-nakuru", name: "LEOPARDO EN NAKURU", imageUrl: "/photos/LEOPARDO EN NAKURU.jpg", isFeline: true,
    variants: [
      { sku: "LEO_NAK_45x60", versionName: "Std 3:4", dimensions: "45x60", isBig: true, prices: { imp: 64000, marco: 156000, ar: 202800 } },
      { sku: "LEO_NAK_30x40", versionName: "Std 3:4", dimensions: "30x40", isBig: false, prices: { imp: 35800, marco: 96000, ar: 124800 } }
    ]
  },
  {
    id: "elefante-macho", name: "ELEFANTE MACHO", imageUrl: "/photos/ELEFANTE MACHO.jpg", isFeline: false,
    variants: [
      { sku: "ELE_MAC_60x90", versionName: "Std 2:3", dimensions: "60x90", isBig: true, prices: { imp: 110400, marco: 243600, ar: 316700 } },
      { sku: "ELE_MAC_40x60", versionName: "Std 2:3", dimensions: "40x60", isBig: true, prices: { imp: 57200, marco: 143800, ar: 186900 } }
    ]
  },
  {
    id: "grupo-nus", name: "GRUPO DE ÑUS", imageUrl: "/photos/GRUPO DE ÑUS.jpg", isFeline: false,
    variants: [
      { sku: "GRU_NUS_80x120", versionName: "Gran Formato", dimensions: "80x120", isBig: true, prices: { imp: 196000, marco: 446000, ar: 579800 } },
      { sku: "GRU_NUS_60x90", versionName: "Std 2:3", dimensions: "60x90", isBig: true, prices: { imp: 110400, marco: 243600, ar: 316700 } }
    ]
  },
  {
    id: "mirada-masai", name: "MIRADA MASÁI", imageUrl: "/photos/MIRADA MASÁI.jpg", isFeline: false,
    variants: [
      { sku: "MIR_MAS_45x60", versionName: "Std 3:4", dimensions: "45x60", isBig: true, prices: { imp: 64000, marco: 156000, ar: 202800 } },
      { sku: "MIR_MAS_30x40", versionName: "Std 3:4", dimensions: "30x40", isBig: false, prices: { imp: 35800, marco: 96000, ar: 124800 } }
    ]
  },
  {
    id: "jirafa-bebiendo", name: "JIRAFA BEBIENDO", imageUrl: "/photos/JIRAFA BEBIENDO.jpg", isFeline: false,
    variants: [
      { sku: "JIR_BEB_50x75", versionName: "Std 2:3", dimensions: "50x75", isBig: true, prices: { imp: 92000, marco: 181200, ar: 235600 } },
      { sku: "JIR_BEB_40x60", versionName: "Std 2:3", dimensions: "40x60", isBig: true, prices: { imp: 57200, marco: 143800, ar: 186900 } }
    ]
  },
  {
    id: "retrato-bufalo", name: "RETRATO DE BÚFALO", imageUrl: "/photos/RETRATO DE BÚFALO.jpg", isFeline: false,
    variants: [
      { sku: "RET_BUF_50x80", versionName: "Panorámica", dimensions: "50x80", isBig: true, prices: { imp: 111200, marco: 220000, ar: 286000 } },
      { sku: "RET_BUF_40x60", versionName: "Std 2:3", dimensions: "40x60", isBig: true, prices: { imp: 57200, marco: 143800, ar: 186900 } }
    ]
  }
];

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

// Parser CSV mejorado para detectar automáticamente coma o punto y coma
const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
};

const parseCSV = (textInput: string) => {
  // 1. Limpieza BOM
  const text = textInput.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) throw new Error("CSV Vacío");

  // 2. Detección de delimitador (Coma o Punto y Coma)
  const firstLine = lines[0];
  const countComma = (firstLine.match(/,/g) || []).length;
  const countSemi = (firstLine.match(/;/g) || []).length;
  const delimiter = countSemi > countComma ? ';' : ',';

  let headerIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const rowRaw = lines[i].toLowerCase();
    if (rowRaw.includes('sku') && (rowRaw.includes('foto') || rowRaw.includes('descripción'))) {
      headerIndex = i;
      headers = parseCSVLine(lines[i], delimiter).map(h => h.toLowerCase().trim());
      break;
    }
  }

  if (headerIndex === -1) throw new Error("Headers CSV no encontrados");

  return lines.slice(headerIndex + 1).map(line => {
    const values = parseCSVLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
};

const fetchWithTimeout = async (url: string, timeout = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { 
        signal: controller.signal, 
        cache: 'no-store',
        headers: { 'Accept': 'text/csv' }
      });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
};

// =====================================================================
// FETCH CATALOG PRINCIPAL
// =====================================================================

export const fetchCatalog = async (): Promise<Product[]> => {
  try {
    let text = '';
    
    // 1. Intentos de red (Cascada)
    try {
        console.log("Cargando catálogo...");
        const res = await fetchWithTimeout(PUBLISHED_URL, 6000); 
        if (!res.ok) throw new Error(`Status ${res.status}`);
        text = await res.text();
    } catch (e) {
        console.warn("Direct fail, trying Proxy 1...", e);
        try {
            const proxy1 = `https://corsproxy.io/?${encodeURIComponent(PUBLISHED_URL)}`;
            const res = await fetchWithTimeout(proxy1, 8000);
            text = await res.text();
        } catch (e2) {
            console.warn("Proxy 1 fail, trying Local Cache...", e2);
        }
    }

    // 2. Fallback a LocalStorage si la red falló
    if (!text) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) text = cached;
        } catch(e) {}
    }

    // 3. Procesamiento
    let result: Product[] = [];
    
    if (text && text.length > 50) {
        // Guardar nuevo caché si tuvimos éxito
        try { localStorage.setItem(CACHE_KEY, text); } catch(e) {}

        const rows = parseCSV(text);
        const productMap = new Map<string, Product>();

        rows.forEach(row => {
            const rawName = row['foto'] || row['descripción foto'] || row['descripcion foto']; 
            const sku = row['sku'] || row['código (sku)'] || row['codigo (sku)'];
            if (!rawName || !sku) return;

            const productId = slugify(rawName);
            if (!productMap.has(productId)) {
                const isFeline = ['leon', 'león', 'leona', 'guepardo', 'leopardo', 'tigre', 'gato', 'felino'].some(x => rawName.toLowerCase().includes(x));
                productMap.set(productId, {
                    id: productId, name: rawName, imageUrl: `/photos/${rawName}.jpg`, isFeline, variants: []
                });
            }
            const product = productMap.get(productId)!;
            const pImp = cleanCurrency(row['pvp imp'] || row['pvp impresion']); 
            const pMarco = cleanCurrency(row['pvp marco']);
            const pAr = cleanCurrency(row['pvp ar']);

            if (pImp > 0) {
                product.variants.push({
                    sku: sku,
                    versionName: row['versión'] || row['version'] || 'Estándar',
                    dimensions: row['medidas'] || row['tamaño cm'] || 'N/A',
                    isBig: (row['esgrande'] === '1' || String(row['esgrande']).toLowerCase() === 'true'),
                    prices: { imp: pImp, marco: pMarco, ar: pAr }
                });
            }
        });
        result = Array.from(productMap.values());
    }

    // 4. EL PARACAÍDAS (Si todo lo anterior falló y result está vacío)
    if (result.length === 0) {
        console.warn("⚠️ Error total de conexión. Usando catálogo de respaldo interno (Hardcoded).");
        return FALLBACK_RAW_DATA as Product[];
    }

    return result;

  } catch (error) {
    console.error("Critical error, using fallback:", error);
    // En el peor de los casos, devolvemos el hardcoded
    return FALLBACK_RAW_DATA as Product[];
  }
};