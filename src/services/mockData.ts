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
// 2. MOTORES DE CÁLCULO (Copiados de la lógica Python)
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
    return Math.min(PRECIO_BASE + extra, 80000); // Intencionalmente como en script (int en python trunca, aqui round para seguridad)
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
// 3. GENERADOR DE VARIANTES (Reglas de Negocio)
// =====================================================================

const getPhotoPath = (name: string) => `/photos/${name}.jpg`;

const crearVariante = (nombreVer: string, w: number, h: number): ProductVariant => {
    // Normalizar orientación para SKU
    const wS = Math.min(w, h);
    const hS = Math.max(w, h); // SKU siempre W menor primero por convención o mantener original?
    // Mantendremos WxH tal cual entra para la lógica visual
    
    // Generar SKU simple
    const skuCode = nombreVer.substring(0,3).toUpperCase() + `_${w}x${h}`;
    
    return {
        sku: skuCode + "_" + Math.random().toString(36).substr(2,5),
        versionName: nombreVer,
        dimensions: `${w}x${h}`,
        isBig: Math.max(w, h) >= 60,
        prices: generarPreciosVenta(w, h)
    };
};

const generarProducto = (id: string, nombre: string, isFeline: boolean): Product => {
    const nombreLower = nombre.toLowerCase();
    const variants: ProductVariant[] = [];

    // --- LÓGICA V38 ---

    // 1. ABUELA MASÁI (Caso Especial)
    if (nombre === "ABUELA MASÁI") {
        variants.push(crearVariante("Original", 50, 62.5));
        variants.push(crearVariante("Std 2:3", 30, 45));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }
    // 2. OTROS MASÁI
    else if (nombreLower.includes('masai') || nombreLower.includes('masái')) {
        // En script: se toma original, y se añaden 30x45 y 20x30
        // Asumiremos orientación vertical por defecto para Masai en general, o ajustamos
        variants.push(crearVariante("Std 2:3", 30, 45));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }
    // 3. BÚFALO (Panorámico)
    else if (nombreLower.includes('búfalo') || nombreLower.includes('bufalo')) {
        variants.push(crearVariante("Panorámica", 50, 80)); // Asumiendo horizontal
        variants.push(crearVariante("Std 2:3", 40, 60));
        variants.push(crearVariante("Std 2:3", 30, 45));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }
    // 4. LEOPARDO (Regla 3:4)
    else if (nombreLower.includes('leopardo')) {
        const noAgrandar = nombreLower.includes('negro') || nombreLower.includes('retrato') || nombreLower.includes('guiño');
        
        // 45x60
        if (!noAgrandar) {
             variants.push(crearVariante("Std 3:4", 45, 60));
        }
        variants.push(crearVariante("Std 3:4", 30, 40));
        variants.push(crearVariante("Std 3:4", 21, 28));
    }
    // 5. GRUPO ÑUS (Gran Formato)
    else if (nombreLower.includes('grupo') && (nombreLower.includes('ñus') || nombreLower.includes('nus'))) {
        variants.push(crearVariante("Gran Formato", 80, 120));
        variants.push(crearVariante("Std 2:3", 60, 90));
        variants.push(crearVariante("Std 2:3", 40, 60));
    }
    // 6. POR DEFECTO (Std 2:3 - La mayoría de fotos safari)
    else {
        // Asumiremos que la mayoría entra en la lógica 2:3
        variants.push(crearVariante("Std 2:3", 60, 90));
        variants.push(crearVariante("Std 2:3", 40, 60));
        variants.push(crearVariante("Std 2:3", 20, 30));
    }

    return {
        id,
        name: nombre,
        imageUrl: getPhotoPath(nombre),
        isFeline,
        variants
    };
};

// =====================================================================
// 4. CATÁLOGO DEFINITIVO
// =====================================================================

export const CATALOG: Product[] = [
    generarProducto("abuela-masai", "ABUELA MASÁI", false),
    generarProducto("retrato-bufalo", "RETRATO DE BÚFALO", false),
    generarProducto("estampida", "ESTAMPIDA", false),
    generarProducto("cebras-peleando", "CEBRAS PELEANDO", false),
    generarProducto("hipopotamo-solitario", "HIPOPÓTAMO SOLITARIO", false),
    generarProducto("perfil-de-leon", "PERFIL DE LEÓN", true),
    generarProducto("guepardo-cria", "GUEPARDO CON SU CRÍA", true),
    generarProducto("guino-leopardo", "GUIÑO DE LEOPARDO", true),
    generarProducto("cachorros-guepardo", "CACHORROS DE GUEPARDO", true),
    generarProducto("leona-lluvia", "LEONA BAJO LA LLUVIA", true),
    generarProducto("leopardo-presa", "LEOPARDO CON PRESA", true),
    generarProducto("babuino-lluvia", "BABUINO BAJO LA LLUVIA", false),
    generarProducto("mono-verde", "RETRATO DE MONO VERDE", false),
    generarProducto("impala-acacia", "IMPALA Y ACACIA", false),
    generarProducto("la-huida", "LA HUIDA", false),
    generarProducto("el-ataque", "EL ATAQUE", false),
    generarProducto("antes-del-cruce", "ANTES DEL CRUCE", false),
    generarProducto("cebra-amamantando", "CEBRA AMAMANTANDO", false),
    generarProducto("cebra-bebe", "CEBRA BEBÉ", false),
    generarProducto("retrato-leopardo", "RETRATO DE LEOPARDO", true),
    generarProducto("retrato-leon", "RETRATO DE LEÓN", true),
    generarProducto("pareja-leones", "PAREJA DE LEONES", true),
    generarProducto("retrato-jirafa", "RETRATO DE JIRAFA", false),
    generarProducto("hippo-rio", "HIPOPÓTAMO EN EL RÍO", false),
    generarProducto("topi", "TOPI", false),
    generarProducto("dos-elefantes", "DOS ELEFANTES", false),
    generarProducto("leopardo-arbol", "LEOPARDO SOBRE ÁRBOL", true),
    generarProducto("leopardo-nakuru", "LEOPARDO EN NAKURU", true),
    generarProducto("elefante-macho", "ELEFANTE MACHO", false),
    generarProducto("elefantes-atardecer", "ELEFANTES AL ATARDECER", false),
    generarProducto("manada-elefantes", "MANADA DE ELEFANTES", false),
    generarProducto("grupo-nus", "GRUPO DE ÑUS", false),
    generarProducto("jirafa-bebiendo", "JIRAFA BEBIENDO", false),
    generarProducto("98-anos", "98 AÑOS DE MASÁI", false),
    generarProducto("caminar-masai", "CAMINAR MASÁI", false),
    generarProducto("mirada-masai", "MIRADA MASÁI", false)
];

export const getProductById = (id: string): Product | undefined => {
  return CATALOG.find(p => p.id === id);
};

export const getAllProducts = (): Product[] => {
  return CATALOG;
};
