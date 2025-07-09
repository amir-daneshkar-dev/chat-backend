import { User, Agent } from '../types';
import apiService from './api';

class AuthService {
  private currentUser: User | Agent | null = null;

  setUser(user: User | Agent) {
    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | Agent | null {
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
        }
      }
    }
    return this.currentUser;
  }

  async refreshUser(): Promise<User | Agent | null> {
    try {
      const user = await apiService.getCurrentUser();
      if (user) {
        this.setUser(user);
        return user;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      this.logout();
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token') && !!this.getUser();
  }

  isAgent(): boolean {
    const user = this.getUser();
    return user && (user.role === 'agent' || 'status' in user);
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user && user.role === 'admin';
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();