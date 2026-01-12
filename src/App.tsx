import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';
import { Product } from './types';
import { fetchCatalog } from './services/mockData';

// Config constant
const WHATSAPP_NUMBER = "56982488499";

// Componente de compatibilidad para redireccionar hash antiguos
const LegacyHashRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const path = window.location.hash.substring(1);
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return null;
};

const App: React.FC = () => {
  // Product Catalog State
  const [products, setProducts] = useState<Product[]>([]);

  // Load catalog on mount
  useEffect(() => {
    fetchCatalog().then(data => {
      setProducts(data);
    });
  }, []);

  return (
    <BrowserRouter>
      <LegacyHashRedirect />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage products={products} />} />
          <Route 
            path="/product/:id" 
            element={
              <ProductPage 
                products={products} 
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