import { CartItem, DiscountResult, MaterialType } from '../types';

export const calculateTotals = (items: CartItem[]): DiscountResult => {
  const count = items.length;
  // Calculate raw subtotal
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);
  
  // Count "Grandes" (Big items)
  const grandesCount = items.reduce((acc, item) => acc + (item.isBig ? 1 : 0), 0);

  let discountRate = 0;
  let label = 'NO APLICA PACK';

  // LOGIC FROM SCRIPT:
  // 1. 4+ items => 20% OFF (PACK KICHWA NGUMU)
  // 2. 3 items => 15% OFF (PACK 3 PARQUES)
  // 3. 2+ "Grandes" => 15% OFF (PACK GIGANTES)

  if (count >= 4) {
    discountRate = 0.20;
    label = 'PACK KICHWA NGUMU (20% OFF)';
  } else if (count >= 3) {
    discountRate = 0.15;
    label = 'PACK 3 PARQUES (15% OFF)';
  } else if (grandesCount >= 2) {
    discountRate = 0.15;
    label = 'PACK GIGANTES (15% OFF)';
  }

  // Calculate final total (rounding to nearest 100 CLP is common in Chile, logic copied from script)
  const totalRaw = subtotal * (1 - discountRate);
  const total = Math.round(totalRaw / 100) * 100;

  return {
    label,
    discountRate,
    subtotal,
    total,
    count,
    grandesCount
  };
};

export const formatMoney = (amount: number): string => {
  return amount.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  });
};

export const getMaterialLabel = (mat: MaterialType): string => {
  switch (mat) {
    case 'imp': return 'Solo Impresión';
    case 'marco': return 'Enmarcado';
    case 'ar': return 'Acrílico (AR)';
    default: return mat;
  }
};
