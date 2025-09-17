import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (signupData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('Auth restored from localStorage:', parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No saved auth found in localStorage');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('useAuth.login called with:', { email, passwordLength: password.length });
    setIsLoading(true);
    try {
      const response = await apiService.login({ email, password });
      console.log('API login response:', response);
      
      if (response.success && response.data) {
        // Handle different possible response structures
        let user, token;
        
        if (response.data.user && response.data.token) {
          // Standard structure: {user: {...}, token: "..."}
          user = response.data.user;
          token = response.data.token;
        } else if (response.data.access_token || response.data.accessToken) {
          // Token-only structure, create user from response
          token = response.data.access_token || response.data.accessToken;
          user = {
            id: response.data.id || response.data.user_id || '1',
            email: email,
            name: response.data.name || response.data.full_name || email.split('@')[0],
            createdAt: new Date().toISOString()
          };
        } else {
          // Fallback: treat entire response.data as user info
          token = 'mock-token-' + Date.now();
          user = {
            id: response.data.id || '1',
            email: email,
            name: response.data.name || response.data.full_name || email.split('@')[0],
            createdAt: new Date().toISOString()
          };
        }
        
        console.log('Login successful, saving to localStorage:', { user, tokenLength: token?.length || 0 });
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        console.log('User state updated, isAuthenticated should be true');
        return { success: true };
      } else {
        console.log('Login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.log('Login network error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.signup(signupData);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    console.log('useAuth.forgotPassword called with:', email);
    
    try {
      const response = await apiService.forgotPassword({ email });
      
      console.log('Forgot password API response:', response);
      
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to send reset email' };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const response = await apiService.resendVerification(email);
      
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to resend verification email' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    forgotPassword,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};