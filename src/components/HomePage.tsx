import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface HomePageProps {
  products: Product[];
}

const HomePage: React.FC<HomePageProps> = ({ products }) => {
  
  const getSafeSrc = (url: string) => {
    const lastSlash = url.lastIndexOf('/');
    const path = url.substring(0, lastSlash + 1);
    const filename = url.substring(lastSlash + 1);
    return path + encodeURIComponent(filename);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center space-y-2 py-8">
        <h1 className="text-3xl font-light uppercase tracking-[0.2em]">Kichwa<span className="font-bold">Ngumu</span></h1>
        <p className="text-muted text-sm max-w-xs mx-auto">
          Catálogo y venta de fotografía fine art.
        </p>
      </div>
      
      {/* Grid de Productos */}
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => {
          const safeSrc = getSafeSrc(product.imageUrl);
          const minPrice = product.variants.length > 0 
            ? Math.min(...product.variants.map(v => v.prices.imp)) 
            : 0;

          return (
          <Link key={product.id} to={`/product/${product.id}`} className="block group">
            <div className="aspect-[4/5] bg-surface rounded-lg overflow-hidden border border-border relative mb-2 flex items-center justify-center">
              <img 
                src={safeSrc} 
                alt={product.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLImageElement).nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-muted p-2 text-center bg-surface">
                 <PhotoIcon className="w-8 h-8 mb-2 opacity-50" />
                 <span className="text-[10px] uppercase font-bold text-red-300">Sin Imagen</span>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide truncate">{product.name}</h3>
            <p className="text-xs text-muted">
                {minPrice > 0 ? `Desde $${(minPrice/1000).toFixed(0)}k` : 'Agotado'}
            </p>
          </Link>
        )})}
      </div>
    </div>
  );
};

export default HomePage;