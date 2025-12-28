import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import CartPage from './components/CartPage';
import { CartItem, MaterialType, Product, ProductVariant } from './types';
import { fetchCatalog } from './services/mockData';

// Config constant from your script
const WHATSAPP_NUMBER = "56982488499";

// Componente de compatibilidad:
// Detecta si alguien entra con un link viejo (/#/product/xyz)
// y lo redirige a la nueva URL limpia (/product/xyz)
const LegacyHashRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Si la URL tiene un hash que parece una ruta antigua...
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const path = window.location.hash.substring(1); // Quita el '#'
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return null;
};

const App: React.FC = () => {
  // Cart State Persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kichwangumu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Product Catalog State
  const [products, setProducts] = useState<Product[]>([]);

  // Load catalog on mount
  useEffect(() => {
    fetchCatalog().then(data => {
      setProducts(data);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('kichwangumu_cart', JSON.stringify(cartItems));
  }, [cartItems]);

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

  return (
    <BrowserRouter>
      <LegacyHashRedirect />
      <Layout cartItemCount={cartItems.length}>
        <Routes>
          <Route path="/" element={<HomePage products={products} />} />
          <Route 
            path="/product/:id" 
            element={
              <ProductPage 
                products={products} 
                onAddToCart={addToCart} 
                whatsappNumber={WHATSAPP_NUMBER}
              />
            } 
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
    </BrowserRouter>
  );
};

export default App;