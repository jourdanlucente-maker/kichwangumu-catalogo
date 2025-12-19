import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import CartPage from './components/CartPage';
import { CartItem, MaterialType, Product, ProductVariant } from './types';

// Config constant from your script
const WHATSAPP_NUMBER = "56982488499";

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

  return (
    <HashRouter>
      <Layout cartItemCount={cartItems.length}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/product/:id" 
            element={<ProductPage onAddToCart={addToCart} />} 
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