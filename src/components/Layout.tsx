import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBagIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Analytics } from '@vercel/analytics/react'; // Usamos /react, no /next (porque usamos Vite)

interface LayoutProps {
  children: React.ReactNode;
  cartItemCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, cartItemCount }) => {
  const location = useLocation();
  
  return (
    // CAMBIO CLAVE: min-h-[100dvh] en lugar de min-h-screen para corregir barra navegación Safari Mobile
    <div className="min-h-[100dvh] flex flex-col font-sans bg-background text-text">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-widest uppercase text-white">
            Kichwa<span className="text-muted">Ngumu</span>
          </Link>

          <div className="flex items-center gap-4">
            {location.pathname !== '/' && (
               <Link to="/" className="p-2 text-muted hover:text-white transition-colors">
                  <HomeIcon className="w-6 h-6" />
               </Link>
            )}
            <Link to="/cart" className="relative p-2 text-white hover:text-accent transition-colors">
              <ShoppingBagIcon className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-black transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-3xl mx-auto p-4 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted border-t border-border mt-auto">
        <p>© 2025 Kichwa Ngumu</p>
        <p className="text-xs mt-1 opacity-50">Photography & Conservation</p>
      </footer>
      
      {/* Analytics Component: Rastrea las visitas en cada cambio de página */}
      <Analytics />
    </div>
  );
};

export default Layout;