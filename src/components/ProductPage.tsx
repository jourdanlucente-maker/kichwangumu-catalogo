import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { ExclamationCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

interface ProductPageProps {
  products: Product[];
  whatsappNumber: string;
}

const ProductPage: React.FC<ProductPageProps> = ({ products, whatsappNumber }) => {
  const { id } = useParams<{ id: string }>();
  
  // BUSCAR EL PRODUCTO EN LA LISTA DESCARGADA
  const product = products.find(p => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <h2 className="text-2xl font-light">Obra no encontrada</h2>
        <p className="text-muted">El código QR escaneado no parece válido o la obra no está en el catálogo.</p>
        <Link to="/" className="inline-block px-6 py-2 border border-white rounded-full hover:bg-white hover:text-black transition">
          Ver Catálogo Completo
        </Link>
      </div>
    );
  }

  const handleInterest = () => {
    const message = `Hola! Estuve viendo el catálogo web y me interesa la fotografía "${product.name}". Me gustaría saber qué tamaños y formatos tienen disponibles.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const getSafeSrc = (url: string) => {
    const lastSlash = url.lastIndexOf('/');
    const path = url.substring(0, lastSlash + 1);
    const filename = url.substring(lastSlash + 1);
    return path + encodeURIComponent(filename);
  };

  return (
    <div className="space-y-8 pb-32">
      
      {/* 1. Imagen y Título */}
      <div className="space-y-4">
        <div className="w-full bg-surface rounded-lg overflow-hidden border border-border relative">
          <img 
            src={getSafeSrc(product.imageUrl)} 
            alt={product.name} 
            loading="lazy"
            decoding="async"
            className="w-full h-auto block"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
            }}
          />
           {/* Fallback visual si la imagen falla */}
           <div className="hidden min-h-[300px] flex flex-col items-center justify-center text-muted p-4 text-center bg-surface">
                 <ExclamationCircleIcon className="w-12 h-12 mb-2 text-red-400 opacity-50" />
                 <span className="text-xs uppercase font-bold text-red-300 mb-1">Sin Imagen</span>
                 <span className="text-[10px] font-mono opacity-60">/photos/{product.name}.jpg</span>
           </div>

           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
           <div className="absolute bottom-0 left-0 p-4 w-full">
             <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-tight">
              {product.name}
            </h1>
           </div>
        </div>
      </div>

      {/* 2. Información y Botón */}
      <div className="space-y-6 animate-slide-up">
        <div className="bg-surface p-6 rounded-lg border border-border text-center space-y-4">
            <p className="text-muted text-sm leading-relaxed">
                Esta obra está disponible en impresiones Fine Art de calidad museo, con opciones de enmarcado en madera nativa o montaje en acrílico.
            </p>
            <p className="text-white font-medium">
                Contáctanos para ver disponibilidad de tamaños y ediciones limitadas.
            </p>
        </div>
      </div>

      {/* Barra Flotante de Acción */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border p-4 z-40 pb-safe shadow-2xl">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleInterest}
            className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-95 transition-all shadow-lg"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            Me Interesa
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductPage;