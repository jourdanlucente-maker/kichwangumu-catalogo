import { Product, ProductVariant, PriceMap } from '../types';

// =====================================================================
// 1. CONFIGURACIÓN Y TABLAS DE REFERENCIA (V38 EXACTAS)
// =====================================================================

const MULT_IMPRESION = 2.0;
const MULT_MARCO = 2.0;
const COSTO_MINIMO_IMPRESION = 3500;

// Tablas de referencia (Ancho, Alto) -> Precio
const PRECIOS_IMPRESION_FIJOS: Record<string, number> = {
    "20x30": 8900, "21x28": 8500, "20x25": 8000, "24x30": 10000,
    "30x40": 17900, "30x45": 20000,
    "40x50": 24000, "40x60": 28600,
    "45x60": 32000, "50x50": 29800, "50x60": 35800,
    "50x62.5": 39000, // Abuela Masái
    "50x70": 44700, "50x75": 46000, "60x80": 55600, "60x90": 55200, "80x120": 98000
};

const PRECIOS_MARCOS_FIJOS: Record<string, number> = {
    "20x30": 36800, "21x28": 35000, "20x25": 34000,
    "30x40": 48000, "30x45": 51800,
    "40x50": 65000, "40x60": 71900,
    "45x60": 78000, "50x50": 75000, "50x60": 80000,
    "50x62.5": 84000,
    "50x70": 85000, "50x75": 90600, "60x80": 110000, "60x90": 121800, "80x120": 223000
};

// =====================================================================
// 2. MOTORES DE CÁLCULO (Lógica Python portada a TypeScript)
// =====================================================================

interface Ref { area: number; precio: number; }

const prepararReferencias = (dict: Record<string, number>): Ref[] => {
    return Object.entries(dict).map(([key, precio]) => {
        const [w, h] = key.split('x').map(Number);
        return { area: w * h, precio };
    }).sort((a, b) => a.area - b.area);
};

const REFS_IMPRESION = prepararReferencias(PRECIOS_IMPRESION_FIJOS);
const REFS_MARCO = prepararReferencias(PRECIOS_MARCOS_FIJOS);

const obtenerPisoVenta = (area: number): number => {
    const AREA_BASE = 600; const AREA_TARGET = 1350;
    const PRECIO_BASE = 40000; const PRECIO_TARGET = 50000;
    
    if (area <= AREA_BASE) return PRECIO_BASE;
    
    const pendiente = (PRECIO_TARGET - PRECIO_BASE) / (AREA_TARGET - AREA_BASE);
    const extra = (area - AREA_BASE) * pendiente;
    return Math.min(PRECIO_BASE + extra, 80000); 
};

const calcularCostoInteligente = (ancho: number, alto: number, tipo: 'impresion' | 'marco'): number => {
    // Normalizar
    if (Math.max(ancho, alto) > 300) { ancho /= 10; alto /= 10; }
    
    const areaObj = ancho * alto;
    const refDict = tipo === 'impresion' ? PRECIOS_IMPRESION_FIJOS : PRECIOS_MARCOS_FIJOS;
    const listaRefs = tipo === 'impresion' ? REFS_IMPRESION : REFS_MARCO;

    // 1. Busqueda exacta (o casi exacta)
    const dimsOrd = [ancho, alto].sort((a,b) => a-b);
    for (const key in refDict) {
        const [rw, rh] = key.split('x').map(Number).sort((a,b) => a-b);
        if (Math.abs(dimsOrd[0] - rw) < 0.6 && Math.abs(dimsOrd[1] - rh) < 0.6) {
            return refDict[key];
        }
    }

    // 2. Interpolación
    let refInf: Ref | null = null;
    let refSup: Ref | null = null;

    for (const ref of listaRefs) {
        if (ref.area <= areaObj) refInf = ref;
        if (ref.area >= areaObj && !refSup) { refSup = ref; break; }
    }

    if (!refInf) {
        const ratio = listaRefs[0].precio / listaRefs[0].area;
        const val = areaObj * ratio;
        return Math.max(Math.floor(val), tipo === 'impresion' ? COSTO_MINIMO_IMPRESION : 15000);
    }
    if (!refSup) {
        const last = listaRefs[listaRefs.length - 1];
        const ratio = last.precio / last.area;
        return Math.floor(areaObj * ratio);
    }

    const m = (refSup.precio - refInf.precio) / (refSup.area - refInf.area);
    return Math.floor(refInf.precio + (areaObj - refInf.area) * m);
};

const generarPreciosVenta = (w: number, h: number): PriceMap => {
    const area = w * h;
    const costoImp = calcularCostoInteligente(w, h, 'impresion');
    const costoMarco = calcularCostoInteligente(w, h, 'marco');
    const piso = obtenerPisoVenta(area);

    const vImp = Math.round(Math.max(costoImp * MULT_IMPRESION, piso) / 100) * 100;
    const vMarco = Math.round(Math.max(costoMarco * MULT_MARCO, piso) / 100) * 100;
    const vAr = Math.round((vMarco * 1.3) / 100) * 100;

    return { imp: vImp, marco: vMarco, ar: vAr };
};

// =====================================================================
// 3. GENERADOR DE PRODUCTOS
// =====================================================================

const slugify = (text: string) => {
    // Normaliza para URL (id)
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
};

// CORRECCIÓN: Usar el nombre EXACTO + .jpg
const getPhotoPath = (name: string) => `/photos/${name.trim()}.jpg`;

const crearVariante = (nombreVer: string, w: number, h: number): ProductVariant => {
    // Generar SKU
    const skuCode = nombreVer.substring(0,3).toUpperCase().replace(/\s/g,'') + `_${w}x${h}`;
    
    return {
        sku: skuCode + "_" + Math.random().toString(36).substr(2,5),
        versionName: nombreVer,
        dimensions: `${w}x${h}`,
        isBig: Math.max(w, h) >= 60,
        prices: generarPreciosVenta(w, h)
    };
};

const generarProducto = (nombre: string): Product => {
    const nombreLower = nombre.toLowerCase();
    
    // Auto-detectar flags
    const isFeline = ['leon','león','leona','guepardo','leopardo','tigre','gato','felino','cheetah'].some(x => nombreLower.includes(x));
    
    const variants: ProductVariant[] = [];

    // --- REGLAS DE VARIANTES (SEGÚN SCRIPT V38) ---

    // 1. ABUELA MASÁI
    if (nombre === "ABUELA MASÁI") {
        variants.push(crearVariante("Original", 50, 62.5));
        variants.push(crearVariante("Std 2:3", 30, 45));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }
    // 2. OTROS MASÁI (Verticales preferentemente)
    else if (nombreLower.includes('masai') || nombreLower.includes('masái')) {
        variants.push(crearVariante("Original", 30, 45));
        variants.push(crearVariante("Pequeño", 20, 30));
    }
    // 3. BÚFALO (Panorámico)
    else if (nombreLower.includes('búfalo') || nombreLower.includes('bufalo')) {
        variants.push(crearVariante("Panorámica", 50, 80));
        variants.push(crearVariante("Std 2:3", 40, 60));
        variants.push(crearVariante("Std 2:3", 30, 45));
    }
    // 4. LEOPARDO (Regla 3:4 preferente)
    else if (nombreLower.includes('leopardo')) {
        const noAgrandar = nombreLower.includes('negro') || nombreLower.includes('retrato') || nombreLower.includes('guiño');
        // Si no es restringido, ofrecemos grande 3:4
        if (!noAgrandar) variants.push(crearVariante("Std 3:4", 45, 60));
        variants.push(crearVariante("Std 3:4", 30, 40));
        variants.push(crearVariante("Std 3:4", 21, 28));
    }
    // 5. GRUPO ÑUS (Gran Formato)
    else if (nombreLower.includes('grupo') && (nombreLower.includes('ñus') || nombreLower.includes('nus'))) {
        variants.push(crearVariante("Gran Formato", 80, 120));
        variants.push(crearVariante("Std 2:3", 60, 90));
        variants.push(crearVariante("Std 2:3", 40, 60));
    }
    // 6. DEFAULT (Std 2:3 - Safari Standard)
    else {
        // Asumimos que la mayoría son apaisadas 2:3
        variants.push(crearVariante("Std 2:3", 60, 90));
        variants.push(crearVariante("Std 2:3", 40, 60));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }

    return {
        id: slugify(nombre), // URL amigable (slug)
        name: nombre,        // Nombre visual
        imageUrl: getPhotoPath(nombre), // Nombre de archivo EXACTO (.jpg)
        isFeline,
        variants
    };
};

// =====================================================================
// 4. CATÁLOGO COMPLETO (36 OBRAS)
// =====================================================================

export const CATALOG: Product[] = [
    // Usamos EXACTAMENTE los nombres que entregó el usuario
    generarProducto("RETRATO DE BÚFALO"),
    generarProducto("ELEFANTE MACHO"),
    generarProducto("GRUPO DE ÑUS"),
    generarProducto("ANTES DEL CRUCE"),
    generarProducto("EL ATAQUE"),
    generarProducto("LA HUIDA"),
    generarProducto("CEBRAS PELEANDO"),
    generarProducto("ESTAMPIDA"),
    generarProducto("RETRATO DE LEÓN"),
    generarProducto("RETRATO DE LEOPARDO"),
    generarProducto("CACHORROS DE GUEPARDO"),
    generarProducto("LEONA BAJO LA LLUVIA"),
    generarProducto("LEOPARDO CON PRESA"),
    generarProducto("TOPI"),
    generarProducto("HIPOPÓTAMO SOLITARIO"),
    generarProducto("JIRAFA BEBIENDO"),
    generarProducto("98 AÑOS DE MASÁI"),
    generarProducto("ABUELA MASÁI"),
    generarProducto("MIRADA MASÁI"),
    generarProducto("CAMINAR MASÁI"),
    generarProducto("PAREJA DE LEONES"),
    generarProducto("GUEPARDO CON SU CRÍA"),
    generarProducto("DOS ELEFANTES"),
    generarProducto("CEBRA AMAMANTANDO"),
    generarProducto("CEBRA BEBÉ"),
    generarProducto("GUIÑO DE LEOPARDO"),
    generarProducto("BABUINO BAJO LA LLUVIA"),
    generarProducto("IMPALA Y ACACIA"),
    generarProducto("RETRATO DE MONO VERDE"),
    generarProducto("PERFIL DE LEÓN"),
    generarProducto("ELEFANTES AL ATARDECER"),
    generarProducto("RETRATO DE JIRAFA"),
    generarProducto("HIPOPÓTAMO EN EL RÍO"),
    generarProducto("LEOPARDO SOBRE ÁRBOL"),
    generarProducto("LEOPARDO EN NAKURU"),
    generarProducto("MANADA DE ELEFANTES")
];

export const getProductById = (id: string): Product | undefined => {
  return CATALOG.find(p => p.id === id);
};

export const getAllProducts = (): Product[] => {
  return CATALOG;
};