import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; error?: string }>;
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
      console.log('Response data structure:', JSON.stringify(response.data, null, 2));
      
      if (response.success && response.data) {
        // Handle different possible response structures
        let user, token;
        
        if (response.data.user && response.data.token) {
          // Standard structure: {user: {...}, token: "..."}
          user = response.data.user;
          token = response.data.token;
          console.log('Using standard structure, user ID:', user.id);
        } else if ((response.data as any).access_token || (response.data as any).accessToken) {
          // Token-only structure, create user from response
          token = (response.data as any).access_token || (response.data as any).accessToken;
          user = {
            id: (response.data as any).id || (response.data as any).user_id || '1',
            email: email,
            name: (response.data as any).name || (response.data as any).full_name || email.split('@')[0],
            createdAt: new Date().toISOString()
          };
          console.log('Using token-only structure, user ID:', user.id);
        } else {
          // Fallback: treat entire response.data as user info
          token = 'mock-token-' + Date.now();
          user = {
            id: (response.data as any).id || '1',
            email: email,
            name: (response.data as any).name || (response.data as any).full_name || email.split('@')[0],
            createdAt: new Date().toISOString()
          };
          console.log('Using fallback structure, user ID:', user.id);
        }
        
        console.log('Login successful, saving to localStorage:', { user, tokenLength: token?.length || 0 });
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        console.log('User state updated, isAuthenticated should be true');
        console.log('User object details:', { id: user.id, email: user.email, name: user.name });
        return { success: true };
      } else {
        console.log('Login failed:', response.error);
        // Map specific error messages to user-friendly messages
        let errorMessage = response.error || 'Login failed';
        
        if (errorMessage.includes('Email not found')) {
          errorMessage = 'Email not found in the system';
        } else if (errorMessage.includes('Incorrect password')) {
          errorMessage = 'Incorrect password';
        } else if (errorMessage.includes('Account is banned')) {
          errorMessage = 'Account is banned';
        } else if (errorMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password';
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.log('Login network error:', error);
      return { success: false, error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    console.log('useAuth.googleLogin called with token length:', idToken.length);
    setIsLoading(true);
    try {
      const response = await apiService.googleLogin(idToken);
      console.log('Google login API response:', response);
      
      if (response.success && response.data) {
        // Backend returns { token: "..." }
        const token = response.data.token;
        
        if (!token) {
          console.log('Google login failed: No token received');
          return { success: false, error: 'No token received from server' };
        }
        
        // Save the token first
        localStorage.setItem('authToken', token);
        console.log('Auth token saved to localStorage');
        
        // Try to decode the JWT token to get user ID and info
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Decoded token payload:', payload);
            
            const userId = payload.sub || payload.userId || payload.id;
            const role = payload.role || 'parent'; // Default role
            const email = payload.email || '';
            
            if (userId) {
              console.log('User ID from token:', userId);
              
              // Try to get user data from backend using the userId
              const userResponse = await apiService.request<any>(`/users/${userId}`);
              if (userResponse.success && userResponse.data) {
                // Map backend UserResponse to frontend User
                const backendUser = userResponse.data;
                const user: User = {
                  id: backendUser.userId || userId,
                  email: backendUser.email || email,
                  name: backendUser.fullName || backendUser.FullName || email.split('@')[0],
                  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
                  createdAt: backendUser.createdDate || new Date().toISOString(),
                  role: role
                };
                
                console.log('Google login successful, user data fetched:', user);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                console.log('User state updated after Google login');
                return { success: true };
              } else {
                // If we can't fetch user data, create minimal user from token
                console.log('Failed to fetch user data, creating from token');
                const user: User = {
                  id: userId,
                  email: email,
                  name: email.split('@')[0],
                  createdAt: new Date().toISOString(),
                  role: role
                };
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true };
              }
            }
          }
          
          console.log('Failed to extract user ID from token');
          return { success: false, error: 'Failed to extract user information' };
        } catch (userError) {
          console.log('Error processing user data after Google login:', userError);
          return { success: false, error: 'Failed to process user data after login' };
        }
      } else {
        console.log('Google login failed:', response.error);
        return { success: false, error: response.error || 'Google login failed' };
      }
    } catch (error) {
      console.log('Google login network error:', error);
      return { success: false, error: 'Network error occurred during Google login' };
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
    googleLogin,
    signup,
    logout,
    forgotPassword,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};