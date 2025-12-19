import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { QrCodeIcon, XMarkIcon, GlobeAmericasIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface HomePageProps {
  products: Product[];
}

const HomePage: React.FC<HomePageProps> = ({ products }) => {
  const [showQrTools, setShowQrTools] = useState(false);
  
  // URL por defecto para QRs
  const PRODUCTION_URL = "https://kichwangumu-catalogo.vercel.app";

  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem('kichwa_public_url');
    return saved || PRODUCTION_URL;
  });

  useEffect(() => {
    localStorage.setItem('kichwa_public_url', baseUrl);
  }, [baseUrl]);

  const getLink = (id: string) => {
    const cleanBase = baseUrl.replace(/\/$/, '');
    return `${cleanBase}/#/product/${id}`;
  };

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
      
      {/* Panel de Admin para QRs */}
      <div className="flex justify-center mb-6">
        <button 
          onClick={() => setShowQrTools(!showQrTools)}
          className={`
            inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
            ${showQrTools 
              ? 'bg-accent text-black shadow-lg shadow-accent/20' 
              : 'bg-surface border border-border text-muted hover:text-white hover:border-white'
            }
          `}
        >
           {showQrTools ? <XMarkIcon className="w-4 h-4" /> : <QrCodeIcon className="w-4 h-4" />}
           <span>{showQrTools ? "Cerrar Panel QR" : "Generar QRs"}</span>
        </button>
      </div>

      {showQrTools && (
        <div className="bg-surface border border-accent/30 p-6 rounded-xl mb-10 animate-fade-in shadow-2xl">
          <div className="mb-6 border-b border-border pb-6 space-y-4">
            <h3 className="text-accent font-bold text-lg flex items-center gap-2">
              <GlobeAmericasIcon className="w-6 h-6" />
              Configuración de QR
            </h3>
            <p className="text-xs text-muted">
              Los QRs apuntarán a: <strong className="text-accent">{baseUrl}</strong>
            </p>
            <input 
              type="text" 
              value={baseUrl} 
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-black border border-border rounded px-3 py-2 text-white font-mono text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => {
              const link = getLink(p.id);
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}&bgcolor=FFFFFF&color=000000&margin=10&format=jpg`;
              return (
                <div key={p.id} className="flex gap-4 items-center bg-black/50 p-3 rounded-lg border border-border">
                   <img src={qrUrl} alt="QR" className="w-20 h-20 bg-white p-1 rounded" />
                   <div className="min-w-0">
                     <p className="font-bold text-white text-sm truncate">{p.name}</p>
                     <a href={qrUrl} download={`QR_${p.name}.jpg`} target="_blank" className="text-[10px] underline text-muted hover:text-white">Descargar JPG</a>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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