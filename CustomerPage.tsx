
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CheckoutPage } from './CheckoutPage';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  category: string;
  minOrderQty: number;
  image: string;
}

export const CustomerPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  const API_URL = 'http://localhost:3001';

  useEffect(() => {
    loadProducts();
    const savedCart = localStorage.getItem('customer_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customer_cart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Product[]>(`${API_URL}/products`);
      setProducts(response.data);
      const uniqueCategories = Array.from(new Set(response.data.map((p: Product) => p.category)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { productId: product.id, quantity: 1, product }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.wholesalePrice * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setShowCheckout(true);
    setShowCart(false);
  };

  const handlePaymentComplete = (paymentData: any) => {
    console.log('Payment completed:', paymentData);
    setCart([]);
    localStorage.removeItem('customer_cart');
    setShowCheckout(false);
    alert('Payment successful! Thank you for your order.');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (showCheckout) {
    return (
      <CheckoutPage 
        cartTotal={getTotal()}
        cartItems={cart}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Navbar */}
      <nav style={{ 
        background: 'purple', 
        padding: '15px 30px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>🛍️ Wholesale Store</h1>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '999px', fontSize: '12px' }}>
            {user?.role}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Welcome, {user?.company || user?.email}</span>
          <button
            onClick={() => setShowCart(!showCart)}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            🛒 Cart
            {getTotalItems() > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '12px'
              }}>
                {getTotalItems()}
              </span>
            )}
          </button>
          <button
            onClick={logout}
            style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Search and Filter */}
      <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '12px 20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>Loading products...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {filteredProducts.map(product => (
              <div key={product.id} style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Product'; }}
                />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{product.name}</h3>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '999px', fontSize: '11px' }}>
                      {product.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{product.sku}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginTop: '10px' }}>
                    ${product.wholesalePrice.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Stock: {product.stock}</p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '12px',
                      background: product.stock > 0 ? '#22c55e' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {product.stock > 0 ? 'Add to Cart 🛒' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <p style={{ fontSize: '18px' }}>No products found</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '400px',
            height: '100%',
            background: 'white',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            padding: '20px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Your Cart</h2>
              <button onClick={() => setShowCart(false)} style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                <p style={{ fontSize: '48px' }}>🛒</p>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.productId} style={{
                    display: 'flex',
                    gap: '15px',
                    padding: '15px',
                    borderBottom: '1px solid #f3f4f6',
                    alignItems: 'center'
                  }}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold' }}>{item.product.name}</p>
                      <p style={{ fontSize: '14px', color: '#2563eb' }}>${item.product.wholesalePrice.toFixed(2)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>Total:</span>
                    <span style={{ color: '#2563eb' }}>${getTotal().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%',
                      marginTop: '15px',
                      padding: '14px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }} onClick={() => setShowCart(false)} />
        </>
      )}
    </div>
  );
};

export default CustomerPage;