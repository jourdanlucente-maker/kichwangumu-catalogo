import React from 'react';
import { CartItem, DiscountResult } from '../types';
import { calculateTotals, formatMoney, getMaterialLabel } from '../services/cartLogic';
import { TrashIcon, ArrowRightIcon, StarIcon } from '@heroicons/react/24/outline';

interface CartPageProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  whatsappNumber: string;
}

const CartPage: React.FC<CartPageProps> = ({ items, onRemoveItem, whatsappNumber }) => {
  const calculation: DiscountResult = calculateTotals(items);

  const handleCheckout = () => {
    if (items.length === 0) return;

    // Construct Message
    const lines = items.map(item => 
      `- ${item.productName} (${item.dimensions}) [${getMaterialLabel(item.material)}]`
    ).join('\n');

    const message = `Hola! Me interesa comprar obras de la exposición Kichwangumu.

Detalle del pedido:
${lines}

${calculation.label !== 'NO APLICA PACK' ? `Pack Aplicado: ${calculation.label}\n` : ''}
Total a Pagar: ${formatMoney(calculation.total)}

Quedo atento al link de pago. Gracias!`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border">
          <TrashIcon className="w-8 h-8 text-muted" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Tu carrito está vacío</h2>
          <p className="text-muted mt-2">Escanea códigos QR en la exposición para agregar obras.</p>
        </div>
      </div>
    );
  }

  // Safe URL encoding helper
  const getSafeSrc = (url: string) => {
    const lastSlash = url.lastIndexOf('/');
    const path = url.substring(0, lastSlash + 1);
    const filename = url.substring(lastSlash + 1);
    return path + encodeURIComponent(filename);
  };

  return (
    <div className="space-y-8 pb-32">
      <h2 className="text-2xl font-light border-b border-border pb-4">Tu Pedido</h2>

      {/* Item List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.cartId} className="flex gap-4 bg-surface p-4 rounded-lg border border-border">
             <div className="w-20 h-20 bg-black rounded overflow-hidden flex-shrink-0">
               <img 
                 src={getSafeSrc(item.imageUrl)} 
                 alt={item.productName} 
                 className="w-full h-full object-cover" 
                 onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
               />
             </div>
             <div className="flex-grow min-w-0">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-white leading-tight truncate pr-2">{item.productName}</h3>
                 {item.isBig && (
                    <span className="flex items-center gap-1 text-[9px] uppercase bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">
                        <StarIcon className="w-3 h-3" /> Grande
                    </span>
                 )}
               </div>
               <p className="text-sm text-muted mt-1">{item.dimensions} cm — {getMaterialLabel(item.material)}</p>
               <div className="flex justify-between items-end mt-2">
                 <span className="font-medium">{formatMoney(item.price)}</span>
                 <button 
                  onClick={() => onRemoveItem(item.cartId)}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                 >
                   Eliminar
                 </button>
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Summary Logic */}
      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatMoney(calculation.subtotal)}</span>
        </div>

        {/* Info about pack progress */}
        {calculation.discountRate === 0 && (
           <div className="text-xs text-muted text-center py-2 bg-black/20 rounded">
             {calculation.count < 3 && `Agrega ${3 - calculation.count} obras más para 15% OFF`}
             {calculation.count >= 3 && calculation.count < 4 && `Agrega 1 obra más para 20% OFF`}
             {calculation.grandesCount === 1 && <span className="block mt-1">O agrega 1 formato "Grande" más para 15% OFF</span>}
           </div>
        )}
        
        {calculation.discountRate > 0 && (
          <div className="flex justify-between text-accent animate-pulse">
            <span className="font-bold">{calculation.label}</span>
            <span>-{formatMoney(calculation.subtotal - calculation.total)}</span>
          </div>
        )}

        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-lg font-light">Total</span>
          <span className="text-2xl font-bold text-white">{formatMoney(calculation.total)}</span>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
        <p>
          <strong>Nota:</strong> Al presionar "Encargar", se abrirá WhatsApp con el detalle para coordinar el pago y envío directamente con nosotros.
        </p>
      </div>

      {/* Fixed Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border p-4 z-40">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
          >
            Encargar por WhatsApp
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;