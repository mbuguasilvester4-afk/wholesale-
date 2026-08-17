import axios from 'axios';
import { Order } from '../types';

const API_URL = 'http://localhost:3001';

export const orderService = {
  // Get all orders
  async getOrders(): Promise<Order[]> {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await axios.get(`${API_URL}/orders?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Create order
  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    try {
      const newOrder = {
        ...order,
        createdAt: new Date().toISOString()
      };
      const response = await axios.post(`${API_URL}/orders`, newOrder);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    try {
      const response = await axios.patch(`${API_URL}/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Delete order
  async deleteOrder(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/orders/${id}`);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
};