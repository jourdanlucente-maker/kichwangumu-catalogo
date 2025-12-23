import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import CartPage from './components/CartPage';
import { CartItem, MaterialType, Product, ProductVariant } from './types';
import { fetchCatalog } from './services/mockData';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const WHATSAPP_NUMBER = "56982488499";

const App: React.FC = () => {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kichwangumu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- EFFECTS ---
  
  // 1. Cargar Catálogo desde Google Sheets
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchCatalog();
        setProducts(data);
        setError(null);
      } catch (err: any) {
        // Mostrar mensaje de error real
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Persistir Carrito
  useEffect(() => {
    localStorage.setItem('kichwangumu_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- HANDLERS ---

  const addToCart = (product: Product, variant: ProductVariant, material: MaterialType) => {
    const newItem: CartItem = {
      cartId: Math.random().toString(36).substr(2, 9),
      productName: product.name,
      variantSku: variant.sku,
      variantName: variant.versionName,
      dimensions: variant.dimensions,
      material: material,
      price: variant.prices[material],
      isBig: variant.isBig,
      imageUrl: product.imageUrl
    };
    setCartItems(prev => [...prev, newItem]);
  };

  const removeItem = (cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white space-y-4">
        <ArrowPathIcon className="w-10 h-10 animate-spin text-accent" />
        <p className="text-sm tracking-widest uppercase">Cargando Catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white p-8 text-center space-y-6">
        <div className="bg-surface p-6 rounded-xl border border-red-900/50 max-w-md w-full">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Error de Conexión</h1>
          <p className="text-sm text-red-200 bg-red-900/20 p-3 rounded font-mono break-words">
            {error}
          </p>
          <p className="text-xs text-muted mt-4 mb-6">
            Intenta recargar. Si el problema persiste, verifica que el Excel esté "Publicado en la Web" (formato CSV) y tenga las columnas correctas (Foto, SKU, Precios).
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <HashRouter>
        <Layout cartItemCount={cartItems.length}>
          <Routes>
            <Route path="/" element={<HomePage products={products} />} />
            <Route 
              path="/product/:id" 
              element={<ProductPage products={products} onAddToCart={addToCart} />} 
            />
            <Route 
              path="/cart" 
              element={
                <CartPage 
                  items={cartItems} 
                  onRemoveItem={removeItem}
                  onClearCart={clearCart}
                  whatsappNumber={WHATSAPP_NUMBER}
                />
              } 
            />
          </Routes>
        </Layout>
      </HashRouter>
      <Analytics />
    </>
  );
};

export default App;