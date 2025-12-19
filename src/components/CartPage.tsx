import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartItem, DiscountResult } from '../types';
import { calculateTotals, formatMoney, getMaterialLabel } from '../services/cartLogic';
import { TrashIcon, StarIcon, CreditCardIcon, ChatBubbleLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface CartPageProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  whatsappNumber: string;
}

const CartPage: React.FC<CartPageProps> = ({ items, onRemoveItem, onClearCart, whatsappNumber }) => {
  const calculation: DiscountResult = calculateTotals(items);
  const [loadingPay, setLoadingPay] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'success' | 'failure' | 'pending'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar retorno de Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status') || params.get('collection_status');
    
    if (status) {
      if (status === 'approved' || status === 'success') {
        setPaymentStatus('success');
        onClearCart();
      } else if (status === 'failure' || status === 'rejected') {
        setPaymentStatus('failure');
      } else if (status === 'pending' || status === 'in_process') {
        setPaymentStatus('pending');
        onClearCart(); // Opcional: limpiar carro si está pendiente, o dejarlo. Generalmente pendiente = compra hecha.
      }
      // Limpiar URL para no reprocesar al refrescar
      navigate('/cart', { replace: true });
    }
  }, [location, onClearCart, navigate]);

  // 1. PAGO: Mercado Pago
  const handleMercadoPago = async () => {
    if (items.length === 0) return;
    setLoadingPay(true);
    setErrorMessage(null);

    try {
      const description = `Pedido Kichwa Ngumu (${calculation.count} obras)`;
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          total: calculation.total,
          description: description
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Error servidor (${response.status}): ${text.slice(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió link de pago.");
      }

    } catch (error: any) {
      console.error("Error pago:", error);
      setErrorMessage(error.message || "Error de conexión");
    } finally {
      setLoadingPay(false);
    }
  };

  // 2. COORDINACIÓN: WhatsApp
  const handleWhatsApp = () => {
    if (items.length === 0) return;

    const lines = items.map(item => 
      `- ${item.productName} (${item.dimensions}) [${getMaterialLabel(item.material)}]`
    ).join('\n');

    const message = `Hola! Me interesa comprar obras de la exposición Kichwangumu.

Detalle del pedido:
${lines}

${calculation.label !== 'NO APLICA PACK' ? `Pack Aplicado: ${calculation.label}\n` : ''}
Total a Pagar: ${formatMoney(calculation.total)}

Prefiero coordinar transferencia o tengo una duda. Gracias!`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  // --- PANTALLAS DE ESTADO ---

  if (paymentStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in px-4">
        <div className="w-24 h-24 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500/50 text-green-400">
          <CheckCircleIcon className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">¡Pago Exitoso!</h2>
          <p className="text-muted mt-4 max-w-sm mx-auto">
            Muchas gracias por tu compra. Te contactaremos a la brevedad para coordinar la entrega.
          </p>
        </div>
        <button 
          onClick={() => setPaymentStatus('none')}
          className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in px-4">
        <div className="w-24 h-24 bg-yellow-900/30 rounded-full flex items-center justify-center border border-yellow-500/50 text-yellow-400">
          <ClockIcon className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Pago Pendiente</h2>
          <p className="text-muted mt-4 max-w-sm mx-auto">
            Tu pago se está procesando. Te avisaremos apenas se confirme.
          </p>
        </div>
        <button 
          onClick={() => setPaymentStatus('none')}
          className="mt-8 px-8 py-3 bg-surface border border-white text-white rounded-full font-bold hover:bg-white/10 transition"
        >
          Volver
        </button>
      </div>
    );
  }

  if (paymentStatus === 'failure') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in px-4">
        <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/50 text-red-400">
          <XCircleIcon className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Pago Rechazado</h2>
          <p className="text-muted mt-4 max-w-sm mx-auto">
            Hubo un problema con el pago. Por favor intenta con otro medio o contáctanos.
          </p>
        </div>
        <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
            <button 
            onClick={() => setPaymentStatus('none')}
            className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition"
            >
            Intentar Nuevamente
            </button>
            <button 
            onClick={handleWhatsApp}
            className="px-8 py-3 bg-surface border border-border text-white rounded-full font-bold hover:bg-surface/80 transition"
            >
            Hablar por WhatsApp
            </button>
        </div>
      </div>
    );
  }

  // --- CARRITO VACÍO ---
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

  const getSafeSrc = (url: string) => {
    const lastSlash = url.lastIndexOf('/');
    const path = url.substring(0, lastSlash + 1);
    const filename = url.substring(lastSlash + 1);
    return path + encodeURIComponent(filename);
  };

  return (
    <div className="space-y-8 pb-48"> 
      <h2 className="text-2xl font-light border-b border-border pb-4">Tu Pedido</h2>

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

      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatMoney(calculation.subtotal)}</span>
        </div>

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

      {/* ERROR DISPLAY */}
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex gap-3 items-start animate-fade-in">
           <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
           <div>
             <p className="text-white font-bold text-sm">Error en el proceso</p>
             <p className="text-red-200 text-xs mt-1 font-mono break-all">{errorMessage}</p>
           </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border p-4 z-40 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-3">
          
          <button
            onClick={handleMercadoPago}
            disabled={loadingPay}
            className={`
              w-full py-3.5 bg-white text-black rounded-full font-bold uppercase tracking-widest 
              flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors
              ${loadingPay ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            {loadingPay ? (
              <span>Procesando...</span>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                Pagar Ahora
              </>
            )}
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={loadingPay}
            className="w-full py-3 border border-border bg-surface text-muted hover:text-white hover:border-white rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            ¿Dudas? Hablar por WhatsApp
          </button>

        </div>
      </div>
    </div>
  );
};

export default CartPage;