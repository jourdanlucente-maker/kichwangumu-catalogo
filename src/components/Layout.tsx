import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Analytics } from '@vercel/analytics/react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  return (
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
            {/* Carrito eliminado en esta versión */}
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
      
      <Analytics />
    </div>
  );
};

export default Layout;