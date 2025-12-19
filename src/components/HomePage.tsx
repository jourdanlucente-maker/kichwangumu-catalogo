import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../services/mockData';
import { QrCodeIcon, XMarkIcon, ExclamationCircleIcon, GlobeAltIcon, WifiIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const products = getAllProducts();
  const [showQrTools, setShowQrTools] = useState(false);
  
  // Network State
  const [mode, setMode] = useState<'local' | 'domain'>('local');
  const [customIp, setCustomIp] = useState(window.location.hostname);
  const [port, setPort] = useState(window.location.port || '5173');
  const [customDomain, setCustomDomain] = useState('https://barbarayjourdan.com');

  // Helper to generate the actual network link
  const getLink = (id: string) => {
    if (mode === 'domain') {
        // Remove trailing slash if user added it
        const base = customDomain.replace(/\/$/, '');
        return `${base}/#/product/${id}`;
    }
    const protocol = window.location.protocol;
    return `${protocol}//${customIp}:${port}/#/product/${id}`;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center space-y-2 py-8">
        <h1 className="text-3xl font-light uppercase tracking-[0.2em]">Kichwa<span className="font-bold">Ngumu</span></h1>
        <p className="text-muted text-sm max-w-xs mx-auto">
          Catálogo y venta de fotografía fine art.
        </p>
      </div>
      
      {/* =========================================================
          HERRAMIENTAS DE PRUEBA (QR GENERATOR)
         ========================================================= */}
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
           <span>{showQrTools ? "Ocultar Herramientas QR" : "Generar QRs para la Expo"}</span>
        </button>
      </div>

      {showQrTools && (
        <div className="bg-surface border border-accent/30 p-6 rounded-xl mb-10 animate-fade-in shadow-2xl">
          <div className="mb-6 border-b border-border pb-6">
            <h3 className="text-accent font-bold text-lg mb-2">Generador de Códigos QR</h3>
            
            <div className="flex gap-4 mb-4">
                <button 
                    onClick={() => setMode('local')}
                    className={`flex-1 py-2 px-4 rounded border flex items-center justify-center gap-2 text-xs uppercase font-bold ${mode === 'local' ? 'bg-white text-black border-white' : 'border-border text-muted'}`}
                >
                    <WifiIcon className="w-4 h-4" /> Pruebas WiFi Local
                </button>
                <button 
                    onClick={() => setMode('domain')}
                    className={`flex-1 py-2 px-4 rounded border flex items-center justify-center gap-2 text-xs uppercase font-bold ${mode === 'domain' ? 'bg-white text-black border-white' : 'border-border text-muted'}`}
                >
                    <GlobeAltIcon className="w-4 h-4" /> Dominio Real
                </button>
            </div>

            {mode === 'local' ? (
                <div className="flex gap-4 max-w-md animate-fade-in">
                <div className="flex-1">
                    <label className="text-[10px] uppercase text-muted tracking-wider">Tu IP Local</label>
                    <input 
                    type="text" 
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                    className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-accent outline-none"
                    />
                </div>
                <div className="w-24">
                    <label className="text-[10px] uppercase text-muted tracking-wider">Puerto</label>
                    <input 
                    type="text" 
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-accent outline-none"
                    />
                </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <label className="text-[10px] uppercase text-muted tracking-wider">Tu Dominio Final (Ej: kichwangumu.com)</label>
                    <input 
                    type="text" 
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="https://tudominio.com"
                    className="w-full bg-black border border-border rounded px-3 py-2 text-white focus:border-accent outline-none"
                    />
                     <p className="text-xs text-muted mt-2">
                        Usa esto para descargar los QRs que imprimirás para la exposición real.
                    </p>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => {
              const link = getLink(p.id);
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}&bgcolor=FFFFFF&color=000000&margin=10&format=jpg`;
              
              return (
                <div key={p.id} className="flex gap-4 items-center bg-black/50 p-3 rounded-lg border border-border group">
                   <div className="bg-white p-1 rounded shrink-0 relative">
                     <img src={qrUrl} alt="QR" className="w-24 h-24" />
                     {/* Download Overlay */}
                     <a 
                        href={qrUrl} 
                        download={`QR_${p.name}.jpg`}
                        className="absolute inset-0 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-bold text-center p-1"
                        target="_blank"
                        rel="noreferrer"
                     >
                        Descargar Imagen
                     </a>
                   </div>
                   <div className="overflow-hidden min-w-0">
                     <p className="font-bold text-white text-sm truncate">{p.name}</p>
                     <p className="text-xs text-muted truncate mt-1">{link}</p>
                     <div className="flex gap-2 mt-2">
                        <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block text-[10px] bg-accent/10 text-accent px-2 py-1 rounded hover:bg-accent hover:text-black transition"
                        >
                        Probar Link
                        </a>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          GRID DE PRODUCTOS (CATÁLOGO NORMAL)
         ========================================================= */}
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => {
          // Safe URL encoding logic
          const lastSlash = product.imageUrl.lastIndexOf('/');
          const path = product.imageUrl.substring(0, lastSlash + 1);
          const filename = product.imageUrl.substring(lastSlash + 1);
          const safeSrc = path + encodeURIComponent(filename);

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
              {/* Fallback if image not found */}
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-muted p-2 text-center bg-surface">
                 <ExclamationCircleIcon className="w-8 h-8 mb-2 text-red-400 opacity-50" />
                 <span className="text-[10px] uppercase font-bold text-red-300 mb-1">Falta Archivo</span>
                 <span className="text-[9px] leading-tight break-all font-mono opacity-60">public{product.imageUrl}</span>
              </div>
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide truncate">{product.name}</h3>
            <p className="text-xs text-muted">Desde {product.variants[0] ? "$" + (Math.min(...(Object.values(product.variants[0].prices) as number[]))/1000).toFixed(0) + "k" : ""}</p>
          </Link>
        )})}
      </div>
    </div>
  );
};

export default HomePage;