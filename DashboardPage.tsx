import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { AdminPayments } from './AdminPayments';
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
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  transactionId?: string;
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'payments'>('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    wholesalePrice: '',
    stock: '',
    category: '',
    minOrderQty: '10',
    image: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '📦'
  });

  const API_URL = 'http://localhost:3001';
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
    // Load sound preference
    const savedSoundPreference = localStorage.getItem('soundEnabled');
    if (savedSoundPreference !== null) {
      setSoundEnabled(savedSoundPreference === 'true');
    }
  }, []);

  // Real-time order monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewOrders();
    }, 5000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orders' || e.key === 'payments') {
        checkForNewOrders();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleOrderPlaced = () => {
      checkForNewOrders();
    };
    window.addEventListener('orderPlaced', handleOrderPlaced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/orders`)
      ]);
      
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const allOrders = [...ordersRes.data, ...localOrders];
      const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
      
      setProducts(productsRes.data);
      setOrders(uniqueOrders);
      setLastOrderCount(uniqueOrders.length);
      
      const uniqueCategories = Array.from(new Set(productsRes.data.map((p: Product) => p.category)));
      const categoryList: Category[] = uniqueCategories.map((name, index) => ({
        id: `cat-${index + 1}`,
        name: name as string,
        description: `${name} products`,
        icon: ['📦', '🔧', '⚙️', '🛠️', '📊', '💻', '🔩', '🧰'][index % 8]
      }));
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewOrders = async () => {
    try {
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const response = await axios.get(`${API_URL}/orders`);
      const apiOrders = response.data;
      
      const allOrders = [...apiOrders, ...localOrders];
      const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
      
      uniqueOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (lastOrderCount !== null && uniqueOrders.length > lastOrderCount) {
        const newOrders = uniqueOrders.slice(0, uniqueOrders.length - lastOrderCount);
        if (newOrders.length > 0) {
          setNewOrderAlert(newOrders[0]);
          setShowAlert(true);
          
          playNotificationSound();
          
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
          }
          alertTimeoutRef.current = setTimeout(() => {
            setShowAlert(false);
          }, 10000);
        }
      }
      
      setOrders(uniqueOrders);
      setLastOrderCount(uniqueOrders.length);
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.15);
      
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      console.warn('⚠️ Could not play notification sound:', error);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('soundEnabled', String(!soundEnabled));
  };

  // ============ PRODUCT MANAGEMENT ============
  const handleAddProduct = async () => {
    try {
      // Validate required fields
      const validationErrors: string[] = [];
      
      if (!productForm.name || productForm.name.trim() === '') {
        validationErrors.push('Product name is required');
      }
      if (!productForm.sku || productForm.sku.trim() === '') {
        validationErrors.push('SKU is required');
      }
      if (!productForm.wholesalePrice || parseFloat(productForm.wholesalePrice) <= 0) {
        validationErrors.push('Wholesale price is required and must be greater than 0');
      }
      if (!productForm.stock || parseInt(productForm.stock) < 0) {
        validationErrors.push('Stock quantity is required and must be 0 or greater');
      }
      if (!productForm.category || productForm.category.trim() === '') {
        validationErrors.push('Please select a category');
      }

      if (validationErrors.length > 0) {
        alert(`Please fix the following errors:\n\n${validationErrors.join('\n')}`);
        return;
      }

      console.log('📦 Creating product with data:', productForm);

      // Create product WITHOUT id - let JSON Server generate it
      const newProduct = {
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        description: productForm.description.trim() || 'No description',
        price: parseFloat(productForm.price) || 0,
        wholesalePrice: parseFloat(productForm.wholesalePrice) || 0,
        stock: parseInt(productForm.stock) || 0,
        category: productForm.category.trim(),
        minOrderQty: parseInt(productForm.minOrderQty) || 10,
        image: imagePreview || productForm.image || 'https://picsum.photos/seed/default/200/200',
        createdAt: new Date().toISOString()
      };

      console.log('📤 Sending to API:', newProduct);

      // Send POST request - JSON Server will auto-generate the ID
      const response = await axios.post(`${API_URL}/products`, newProduct, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Product added successfully:', response.data);
      console.log('📊 Response status:', response.status);
      
      // Update products list
      setProducts([response.data, ...products]);
      resetProductForm();
      setShowAddProduct(false);
      
      // Show success message
      alert(`✅ Product "${newProduct.name}" added successfully!`);
      
      // Refresh data to update categories
      await loadData();
    } catch (error) {
      console.error('❌ Error adding product:', error);
      
      // Detailed error handling
      if (axios.isAxiosError(error)) {
        console.error('📊 Response data:', error.response?.data);
        console.error('📊 Status code:', error.response?.status);
        console.error('📊 Request data:', error.config?.data);
        
        let errorMessage = 'Failed to add product.\n\n';
        
        if (error.response?.status === 500) {
          errorMessage += 'Server Error (500):\n';
          errorMessage += '• Check if JSON Server is running\n';
          errorMessage += '• Check if db.json is valid\n';
          errorMessage += '• Try restarting JSON Server\n\n';
          errorMessage += 'Run: npm run server';
        } else if (error.response?.status === 404) {
          errorMessage += 'Server not found (404):\n';
          errorMessage += '• Make sure JSON Server is running on port 3000\n';
          errorMessage += '• Check your API_URL in the code\n\n';
          errorMessage += `Current API_URL: ${API_URL}`;
        } else if (error.response?.status === 400) {
          errorMessage += `Bad Request (400):\n${error.response?.data?.message || 'Invalid data format'}`;
        } else {
          errorMessage += `Error (${error.response?.status || 'Unknown'}):\n`;
          errorMessage += error.response?.data?.message || error.message;
        }
        
        alert(errorMessage);
      } else {
        alert(`Failed to add product:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price.toString(),
      wholesalePrice: product.wholesalePrice.toString(),
      stock: product.stock.toString(),
      category: product.category,
      minOrderQty: product.minOrderQty.toString(),
      image: product.image
    });
    setImagePreview(product.image);
    setShowAddProduct(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const updatedProduct = {
        sku: productForm.sku,
        name: productForm.name,
        description: productForm.description || 'No description',
        price: parseFloat(productForm.price) || 0,
        wholesalePrice: parseFloat(productForm.wholesalePrice) || 0,
        stock: parseInt(productForm.stock) || 0,
        category: productForm.category || 'Uncategorized',
        minOrderQty: parseInt(productForm.minOrderQty) || 10,
        image: imagePreview || productForm.image || editingProduct.image,
        createdAt: editingProduct.createdAt || new Date().toISOString()
      };

      const response = await axios.put(`${API_URL}/products/${editingProduct.id}`, updatedProduct);
      setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      resetProductForm();
      setShowAddProduct(false);
      setEditingProduct(null);
      alert('Product updated successfully!');
      
      loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      description: '',
      price: '',
      wholesalePrice: '',
      stock: '',
      category: '',
      minOrderQty: '10',
      image: ''
    });
    setImagePreview(null);
    setEditingProduct(null);
  };

  const getPreviewImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const imageUrlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp)(?:\?.*)?)$/i;
    return imageUrlPattern.test(trimmed) ? trimmed : null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 30MB)
      if (file.size > 30 * 1024 * 1024) {
        alert('Image size must be less than 30MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProductForm({ ...productForm, image: result });
      };
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ============ CATEGORY MANAGEMENT ============
  const handleAddCategory = () => {
    if (!categoryForm.name) {
      alert('Category name is required!');
      return;
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: categoryForm.name,
      description: categoryForm.description || `${categoryForm.name} products`,
      icon: categoryForm.icon || '📦'
    };

    setCategories([...categories, newCategory]);
    setCategoryForm({ name: '', description: '', icon: '📦' });
    setShowAddCategory(false);
    alert('Category added successfully!');
  };

  const handleDeleteCategory = (categoryName: string) => {
    const hasProducts = products.some(p => p.category === categoryName);
    if (hasProducts) {
      alert(`Cannot delete "${categoryName}" because it has products. Move or delete the products first.`);
      return;
    }
    
    if (!window.confirm(`Delete category "${categoryName}"?`)) return;
    setCategories(categories.filter(c => c.name !== categoryName));
    alert('Category deleted successfully!');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* New Order Alert Banner */}
      {showAlert && newOrderAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#414745',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 10000,
          animation: 'slideIn 0.1s ease-out',
          maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🛍️</span>
            <div>
              <h4 style={{ margin: 0, fontWeight: 'bold' }}>New Order Received!</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                Order #{newOrderAlert.id} from {newOrderAlert.userId}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                Total: ${newOrderAlert.total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0; }
        }
        .live-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ 
        background: 'purple', 
        padding: '15px 30px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '10px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Admin Dashboard</h1>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981' }}>
            <span className="live-dot"></span>
            Live
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={toggleSound}
            style={{
              padding: '8px 16px',
              background: soundEnabled ? '#22c55e' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            title={soundEnabled ? 'Click to mute sound notifications' : 'Click to unmute sound notifications'}
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
          
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Orders: <strong>{orders.length}</strong>
          </span>
          <span>{user?.email}</span>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '999px', fontSize: '12px' }}>Admin</span>
          <button onClick={logout} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={loadData}
              style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: 'crimson', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Total Revenue</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>${totalRevenue.toFixed(2)}</p>
            <span style={{ fontSize: '12px', color: '#10b981' }}>↑ from {orders.length} orders</span>
          </div>
          <div style={{ background: 'seagreen', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#2c4069', fontSize: '14px' }}>Total Orders</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{orders.length}</p>
            <span style={{ fontSize: '12px', color: '#10b981' }}>New: {orders.filter(o => new Date(o.createdAt).getTime() > Date.now() - 86400000).length} today</span>
          </div>
          <div style={{ background: 'darkgray', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Products</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{products.length}</p>
          </div>
          <div style={{ background: 'cyan', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#6b7280', fontSize: '14px' }}>Categories</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{categories.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{ padding: '8px 16px', background: activeTab === 'dashboard' ? '#2563eb' : '#e5e7eb', color: activeTab === 'dashboard' ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{ padding: '8px 16px', background: activeTab === 'products' ? '#2563eb' : '#e5e7eb', color: activeTab === 'products' ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📦 Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{ padding: '8px 16px', background: activeTab === 'categories' ? '#2563eb' : '#e5e7eb', color: activeTab === 'categories' ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            🏷️ Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{ padding: '8px 16px', background: activeTab === 'orders' ? '#2563eb' : '#e5e7eb', color: activeTab === 'orders' ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📋 Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            style={{ padding: '8px 16px', background: activeTab === 'payments' ? '#2563eb' : '#e5e7eb', color: activeTab === 'payments' ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            💳 Payments
          </button>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div style={{ background: 'burlywood', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Recent Orders</h3>
              <span style={{ fontSize: '12px', color: '#0a1221' }}>
                {orders.filter(o => new Date(o.createdAt).getTime() > Date.now() - 86400000).length} new today
              </span>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: '#1f2b43' }}>No orders yet. Waiting for customers...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #3e4553' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Items</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Total</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(order => {
                      const isNew = new Date(order.createdAt).getTime() > Date.now() - 60000;
                      return (
                        <tr key={order.id} style={{ 
                          borderBottom: '1px solid #e5e7eb',
                          background: isNew ? '#70be87' : 'transparent'
                        }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>
                            {order.id}
                            {isNew && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '999px' }}>NEW</span>}
                          </td>
                          <td style={{ padding: '10px' }}>{order.userId}</td>
                          <td style={{ padding: '10px' }}>{order.items?.length || 0}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>${order.total.toFixed(2)}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ 
                              padding: '4px 12px', 
                              borderRadius: '999px', 
                              fontSize: '12px',
                              background: order.status === 'delivered' ? '#337e4d' : 
                                        order.status === 'paid' ? '#616d7d' : '#658820'
                            }}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontSize: '14px', color: '#374151' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '10px', fontSize: '14px', color: '#ba2d2d' }}>
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {orders.length > 10 && (
                  <p style={{ textAlign: 'center', marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                    Showing 10 of {orders.length} orders. Go to Orders tab to see all.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '200px' }}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowAddProduct(true);
                  setEditingProduct(null);
                }}
                style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ Add Product
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Product'; }}
                  />
                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4 style={{ fontWeight: 'bold' }}>{product.name}</h4>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '999px', fontSize: '11px' }}>
                        {product.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{product.sku}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>{product.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                      <div>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>${product.wholesalePrice}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Stock: {product.stock}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleEditProduct(product)}
                          style={{ padding: '4px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No products found</p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Manage Categories</h3>
              <button
                onClick={() => setShowAddCategory(true)}
                style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ Add Category
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {categories.map(category => {
                const productCount = products.filter(p => p.category === category.name).length;
                return (
                  <div key={category.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: '40px' }}>{category.icon}</div>
                        <h4 style={{ fontWeight: 'bold', marginTop: '10px' }}>{category.name}</h4>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>{category.description}</p>
                        <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '5px' }}>
                          {productCount} product{productCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.name)}
                        style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {categories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>No categories created yet.</p>
                <p style={{ fontSize: '14px' }}>Add a category to organize your products.</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div style={{ background: 'ivory', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>All Orders</h3>
              <span style={{ fontSize: '12px', color: '#0a1221' }}>
                {orders.length} total orders
              </span>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No orders yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Order ID</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Customer</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Items</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Total</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Payment</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{order.id}</td>
                        <td style={{ padding: '10px' }}>{order.userId}</td>
                        <td style={{ padding: '10px' }}>{order.items?.length || 0}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>${order.total.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '999px', 
                            fontSize: '12px',
                            background: order.status === 'delivered' ? '#dcfce7' : 
                                      order.status === 'paid' ? '#dbeafe' : '#fef3c7'
                          }}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {order.paymentMethod === 'credit_card' ? '💳' : '💰'}
                          {order.paymentMethod || 'N/A'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', color: '#6b7280' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && <AdminPayments />}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'ivory', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => { setShowAddProduct(false); resetProductForm(); }} style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Product Image</label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  border: '2px dashed #ddd', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#6b7280' }}>📷</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'block', marginBottom: '5px' }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Or enter URL below</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Product Name *"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="SKU *"
                value={productForm.sku}
                onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Min Order Qty</label>
                  <input
                    type="number"
                    placeholder="Min Order Qty"
                    value={productForm.minOrderQty}
                    onChange={(e) => setProductForm({...productForm, minOrderQty: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Price (Retail)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Wholesale Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.wholesalePrice}
                    onChange={(e) => setProductForm({...productForm, wholesalePrice: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280' }}>Stock *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '4px' }}
                    required
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Image URL"
                value={productForm.image}
                onChange={(e) => {
                  const url = e.target.value;
                  setProductForm({ ...productForm, image: url });
                  setImagePreview(getPreviewImageUrl(url));
                }}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                Enter a direct image URL ending in .png, .jpg, .jpeg, .gif, .bmp, or .webp.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                onClick={() => { setShowAddProduct(false); resetProductForm(); }}
                style={{ flex: 1, padding: '12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'ivory', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Add New Category</h3>
              <button onClick={() => setShowAddCategory(false)} style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Category Name *"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Icon (emoji) e.g., 📦"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                maxLength={2}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleAddCategory}
                style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Add Category
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                style={{ flex: 1, padding: '12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;