import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
      const data = await fetchCatalog();
      if (data.length === 0) {
        setError("No se pudieron cargar los productos. Verifica que la hoja de cálculo esté publicada en la web.");
      } else {
        setProducts(data);
        setError(null);
      }
      setLoading(false);
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

  // --- RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white space-y-4">
        <ArrowPathIcon className="w-10 h-10 animate-spin text-accent" />
        <p className="text-sm tracking-widest uppercase">Cargando Catálogo...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white p-8 text-center space-y-6">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
        <h1 className="text-xl font-bold">Error de Conexión</h1>
        <p className="text-muted max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black rounded-full font-bold">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout cartItemCount={cartItems.length}>
        <Routes>
          {/* AQUÍ ESTABA EL ERROR: Pasamos 'products' como props */}
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
                whatsappNumber={WHATSAPP_NUMBER}
              />
            } 
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;