import axios from 'axios';
import { userService } from './userService';

const API_URL = 'http://localhost:3001';

export const databaseSyncService = {
  /**
   * Sync user data from database
   */
  async syncUser(email: string): Promise<any> {
    try {
      const user = await userService.getUserByEmail(email);
      if (user) {
        // Update local storage with latest user data
        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error syncing user:', error);
      return null;
    }
  },

  /**
   * Sync all users (admin only)
   */
  async syncAllUsers(): Promise<any[]> {
    try {
      const users = await userService.getAllUsers();
      localStorage.setItem('all_users', JSON.stringify(users));
      return users;
    } catch (error) {
      console.error('Error syncing all users:', error);
      return [];
    }
  },

  /**
   * Get user email from database by ID
   */
  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const user = await userService.getUserById(userId);
      return user ? user.email : null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  },

  /**
   * Get user data for email notification
   */
  async getUserNotificationData(email: string): Promise<{
    email: string;
    name: string;
    company: string;
  } | null> {
    try {
      const user = await userService.getUserByEmail(email);
      if (user) {
        return {
          email: user.email,
          name: user.fullName || 'User',
          company: user.company || 'N/A'
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user notification data:', error);
      return null;
    }
  }
};

export default databaseSyncService;