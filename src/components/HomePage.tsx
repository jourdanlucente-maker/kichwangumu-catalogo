import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../services/mockData';
import { QrCodeIcon, XMarkIcon, GlobeAmericasIcon, LinkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const products = getAllProducts();
  const [showQrTools, setShowQrTools] = useState(false);
  
  // URL DE PRODUCCIÓN DEFINITIVA
  const PRODUCTION_URL = "https://kichwangumu-catalogo.vercel.app";

  // Lógica: Si no hay nada guardado, usar la de producción.
  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem('kichwa_public_url');
    // Prioridad: Lo guardado > Producción > Local (fallback)
    return saved || PRODUCTION_URL;
  });

  useEffect(() => {
    localStorage.setItem('kichwa_public_url', baseUrl);
  }, [baseUrl]);

  const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('192.168');

  const getLink = (id: string) => {
    const cleanBase = baseUrl.replace(/\/$/, '');
    return `${cleanBase}/#/product/${id}`;
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
          HERRAMIENTAS DE ADMIN (QR GENERATOR)
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
           <span>{showQrTools ? "Cerrar Panel QR" : "Generar QRs para Exposición"}</span>
        </button>
      </div>

      {showQrTools && (
        <div className="bg-surface border border-accent/30 p-6 rounded-xl mb-10 animate-fade-in shadow-2xl">
          <div className="mb-6 border-b border-border pb-6 space-y-4">
            <h3 className="text-accent font-bold text-lg flex items-center gap-2">
              <GlobeAmericasIcon className="w-6 h-6" />
              Configurar URL Pública
            </h3>
            
            <div className="bg-blue-900/20 border border-blue-800 p-4 rounded text-xs text-blue-100 space-y-2">
              <p className="font-bold text-sm">Configuración Lista</p>
              <p>
                Los códigos QR están configurados para apuntar a: <br/>
                <strong className="text-accent">{PRODUCTION_URL}</strong>
              </p>
            </div>

            <div>
              <label className="text-[10px] uppercase text-muted tracking-wider block mb-2">
                Dirección Web (Editable)
              </label>
              <div className="flex items-center gap-2 bg-black border border-border rounded px-3 py-2 focus-within:border-accent">
                <LinkIcon className="w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="flex-1 bg-transparent text-white outline-none font-mono text-sm"
                />
              </div>
              
              {isLocal && (
                <div className="flex items-start gap-2 mt-3 text-yellow-500 bg-yellow-500/10 p-2 rounded">
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-bold">
                    Estás usando una dirección local. Los QR no funcionarán públicamente.
                    <button onClick={() => setBaseUrl(PRODUCTION_URL)} className="underline ml-1 text-white">Restablecer a Vercel</button>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => {
              const link = getLink(p.id);
              // API externa para generar QR
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}&bgcolor=FFFFFF&color=000000&margin=10&format=jpg`;
              
              return (
                <div key={p.id} className="flex gap-4 items-center bg-black/50 p-3 rounded-lg border border-border group">
                   <div className="bg-white p-1 rounded shrink-0 relative group-hover:scale-105 transition-transform">
                     <img src={qrUrl} alt="QR" className="w-24 h-24" />
                   </div>
                   <div className="overflow-hidden min-w-0 flex-1">
                     <p className="font-bold text-white text-sm truncate">{p.name}</p>
                     <p className="text-[10px] text-muted truncate mt-1 font-mono">{link}</p>
                     <div className="flex gap-2 mt-2">
                        <a 
                            href={qrUrl} 
                            download={`QR_${p.name}.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold hover:bg-gray-200"
                        >
                          Descargar JPG
                        </a>
                        <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] border border-border text-muted px-2 py-1 rounded hover:text-white hover:border-white"
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
          GRID DE PRODUCTOS
         ========================================================= */}
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => {
          // Codificación segura para nombres de archivo con espacios y tildes
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
              {/* Fallback visual si falla la imagen */}
              <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-muted p-2 text-center bg-surface">
                 <XMarkIcon className="w-8 h-8 mb-2 text-red-400 opacity-50" />
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