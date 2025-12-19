import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatMoney } from '../services/cartLogic';
import { MaterialType, ProductVariant, Product } from '../types';
import { CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface ProductPageProps {
  products: Product[]; // Nuevo prop obligatorio
  onAddToCart: (product: Product, variant: ProductVariant, material: MaterialType) => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ products, onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  // Buscar en la lista pasada por props
  const product = products.find(p => p.id === id);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedVariant(null);
    setSelectedMaterial(null);
  }, [id]);

  if (!product) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <h2 className="text-2xl font-light">Obra no encontrada</h2>
        <p className="text-muted">El catálogo se actualizó o el enlace es incorrecto.</p>
        <Link to="/" className="inline-block px-6 py-2 border border-white rounded-full hover:bg-white hover:text-black transition">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    setSelectedMaterial(null);
  };

  const currentPrice = selectedVariant && selectedMaterial 
    ? selectedVariant.prices[selectedMaterial] 
    : 0;

  const handleAdd = () => {
    if (selectedVariant && selectedMaterial) {
      onAddToCart(product, selectedVariant, selectedMaterial);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Safe encoding para la imagen
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
        <div className="aspect-square w-full bg-surface rounded-lg overflow-hidden border border-border relative flex items-center justify-center">
          <img 
            src={getSafeSrc(product.imageUrl)} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
            }}
          />
           <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-muted p-4 text-center bg-surface z-10">
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

      {/* 2. Seleccionar Formato */}
      <div className="space-y-3 animate-slide-up">
        <h3 className="text-sm font-bold uppercase text-muted tracking-wider">1. Seleccionar Formato</h3>
        
        {product.variants.length === 0 ? (
           <p className="text-red-400 text-sm">No hay variantes disponibles para esta obra.</p>
        ) : (
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
        )}
      </div>

      {/* 3. Seleccionar Material */}
      {selectedVariant && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-bold uppercase text-muted tracking-wider">2. Material de Impresión</h3>
          <div className="space-y-2">
            {[
              { id: 'imp', label: 'Solo Impresión', desc: 'Papel Fine Art' },
              { id: 'marco', label: 'Enmarcado', desc: 'Madera nativa + Vidrio' },
              { id: 'ar', label: 'Acrílico (AR)', desc: 'Montaje moderno' }
            ].map((mat) => {
              const price = selectedVariant.prices[mat.id as MaterialType];
              if (!price) return null; // No mostrar si precio es 0

              return (
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
                      {formatMoney(price)}
                   </span>
                </div>
              </button>
            )})}
          </div>
        </div>
      )}

      {/* Barra Flotante de Precio */}
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