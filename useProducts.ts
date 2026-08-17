import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { productService } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await productService.createProduct(product);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      setError('Failed to add product');
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await productService.updateProduct(id, updates);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      setError('Failed to update product');
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete product');
      throw err;
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const data = await productService.searchProducts(query);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to search products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts
  };
};