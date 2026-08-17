import axios from 'axios';
import { Product } from '../types';

const API_URL = 'http://localhost:3001';

export const productService = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await axios.get(`${API_URL}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product
  async getProduct(id: string): Promise<Product> {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Create product
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const response = await axios.post(`${API_URL}/products`, product);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const response = await axios.patch(`${API_URL}/products/${id}`, product);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/products/${id}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await axios.get(`${API_URL}/products?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await axios.get(`${API_URL}/products?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Update stock
  async updateStock(id: string, stock: number): Promise<Product> {
    try {
      const response = await axios.patch(`${API_URL}/products/${id}`, { stock });
      return response.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }
};