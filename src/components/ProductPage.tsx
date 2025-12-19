import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/mockData';
import { formatMoney, getMaterialLabel } from '../services/cartLogic';
import { MaterialType, ProductVariant } from '../types';
import { ChevronRightIcon, CheckIcon } from '@heroicons/react/24/solid';

interface ProductPageProps {
  onAddToCart: (product: any, variant: ProductVariant, material: MaterialType) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || '');

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Scroll to top on load
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

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    setSelectedMaterial(null); // Reset material if size changes to force re-selection or just flow
  };

  const currentPrice = selectedVariant && selectedMaterial 
    ? selectedVariant.prices[selectedMaterial] 
    : 0;

  const handleAdd = () => {
    if (selectedVariant && selectedMaterial) {
      onAddToCart(product, selectedVariant, selectedMaterial);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      // We don't clear selection so they can see what they just bought
    }
  };

  return (
    <div className="space-y-8 pb-32">
      
      {/* 1. Image & Title */}
      <div className="space-y-4">
        <div className="aspect-square w-full bg-surface rounded-lg overflow-hidden border border-border relative">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
           <div className="absolute bottom-0 left-0 p-4 w-full">
             <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-tight">
              {product.name}
            </h1>
           </div>
        </div>
      </div>

      {/* 2. Select Format */}
      <div className="space-y-3 animate-slide-up">
        <h3 className="text-sm font-bold uppercase text-muted tracking-wider">1. Seleccionar Formato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {product.variants.map((v) => (
            <button
              key={v.sku}
              onClick={() => handleVariantSelect(v)}
              className={`
                relative p-4 rounded-lg border text-left transition-all duration-200 group
                ${selectedVariant?.sku === v.sku 
                  ? 'bg-white text-black border-white' 
                  : 'bg-surface text-muted border-border hover:border-muted'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="block font-medium text-lg">{v.dimensions} cm</span>
                  <span className="text-xs opacity-70 uppercase">{v.versionName}</span>
                </div>
                {selectedVariant?.sku === v.sku && <CheckIcon className="w-5 h-5 text-black" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Select Material (Only if Format Selected) */}
      {selectedVariant && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold uppercase text-muted tracking-wider">2. Material de Impresión</h3>
          <div className="space-y-2">
            {[
              { id: 'imp', label: 'Solo Impresión', desc: 'Papel Fine Art calidad museo' },
              { id: 'marco', label: 'Enmarcado', desc: 'Madera nativa, listo para colgar' },
              { id: 'ar', label: 'Acrílico (AR)', desc: 'Montaje moderno sin reflejos' }
            ].map((mat) => (
              <button
                key={mat.id}
                onClick={() => setSelectedMaterial(mat.id as MaterialType)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                  ${selectedMaterial === mat.id 
                    ? 'bg-surface border-accent text-white shadow-[0_0_15px_rgba(102,252,241,0.1)]' 
                    : 'bg-surface border-border text-muted hover:bg-surface/80'
                  }
                `}
              >
                <div className="text-left">
                  <span className={`block font-medium ${selectedMaterial === mat.id ? 'text-accent' : 'text-white'}`}>
                    {mat.label}
                  </span>
                  <span className="text-xs opacity-60">{mat.desc}</span>
                </div>
                <div className="text-right">
                   <span className="block font-bold text-white">
                      {formatMoney(selectedVariant.prices[mat.id as MaterialType])}
                   </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border p-4 z-40 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted uppercase">Precio Total</span>
            <span className="text-xl font-bold text-white">
              {currentPrice > 0 ? formatMoney(currentPrice) : '---'}
            </span>
          </div>
          
          <button
            disabled={!selectedVariant || !selectedMaterial}
            onClick={handleAdd}
            className={`
              flex-1 py-3 px-6 rounded-full font-bold uppercase tracking-wider transition-all
              ${selectedVariant && selectedMaterial 
                ? 'bg-white text-black hover:bg-gray-200 active:scale-95' 
                : 'bg-border text-muted cursor-not-allowed'
              }
            `}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-accent text-black px-6 py-3 rounded-full shadow-xl z-50 animate-bounce-in flex items-center gap-2 w-max">
          <CheckIcon className="w-5 h-5" />
          <span className="font-bold text-sm">Agregado al carro</span>
        </div>
      )}

    </div>
  );
};

export default ProductPage;