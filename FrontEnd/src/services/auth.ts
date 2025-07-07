import { User, Agent } from '../types';

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

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token') && !!this.getUser();
  }

  isAgent(): boolean {
    const user = this.getUser();
    return user && 'status' in user;
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