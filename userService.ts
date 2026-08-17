import axios from 'axios';

const API_URL = 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'wholesaler' | 'retailer';
  company: string;
  fullName: string;
  createdAt: string;
  lastLogin?: string;
  isVerified?: boolean;
}

export const userService = {
  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_URL}/users?email=${email}`);
      const users = response.data;
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Update user
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    try {
      const response = await axios.patch(`${API_URL}/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // Update last login time
  async updateLastLogin(email: string): Promise<void> {
    try {
      const user = await this.getUserByEmail(email);
      if (user) {
        await this.updateUser(user.id, { 
          lastLogin: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Check if user exists
  async userExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  },

  // Get user by token (for password reset)
  async getUserByResetToken(token: string): Promise<User | null> {
    try {
      // In production, this would check a reset_tokens table
      // For now, we'll check localStorage
      const resetData = localStorage.getItem(`reset_${token}`);
      if (!resetData) return null;
      
      const { email } = JSON.parse(resetData);
      return await this.getUserByEmail(email);
    } catch (error) {
      console.error('Error getting user by token:', error);
      return null;
    }
  }
};

export default userService;