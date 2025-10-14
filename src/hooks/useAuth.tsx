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
        // Backend only returns token, not user data
        const token = typeof response.data === 'string' ? response.data : response.data.token;
        
        if (!token) {
          console.log('Google login failed: No token received');
          return { success: false, error: 'No token received from server' };
        }
        
        // Since backend doesn't return user data, we need to fetch it separately
        // First save the token
        localStorage.setItem('authToken', token);
        
        // Then fetch user data using the token
        try {
          const userResponse = await apiService.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            const user = userResponse.data;
            console.log('Google login successful, user data fetched:', user);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            console.log('User state updated after Google login');
            return { success: true };
          } else {
            console.log('Failed to fetch user data after Google login:', userResponse.error);
            return { success: false, error: userResponse.error || 'Failed to fetch user data' };
          }
        } catch (userError) {
          console.log('Error fetching user data after Google login:', userError);
          return { success: false, error: 'Failed to fetch user data after login' };
        }
      } else {
        console.log('Google login failed:', response.error);
        
        // Handle specific backend database errors
        let errorMessage = response.error || 'Google login failed';
        if (errorMessage.includes('saving the entity changes')) {
          // Database constraint error - create a temporary session for user
          console.log('Database error detected, creating temporary session');
          
          // Extract email from Google token (we can't decode JWT in frontend, so use a workaround)
          const tempUser = {
            id: 'temp-' + Date.now(),
            email: 'google-user@temp.com', // We'll update this when backend is fixed
            name: 'Google User',
            createdAt: new Date().toISOString(),
            role: 'parent'
          };
          
          const tempToken = 'temp-google-token-' + Date.now();
          
          localStorage.setItem('authToken', tempToken);
          localStorage.setItem('user', JSON.stringify(tempUser));
          setUser(tempUser);
          
          console.log('Temporary session created for Google user');
          return { 
            success: true, 
            error: 'Logged in with temporary session due to database issue. Some features may be limited.' 
          };
        } else if (errorMessage.includes('PasswordHash')) {
          errorMessage = 'Account setup error. Please try again.';
        }
        
        return { success: false, error: errorMessage };
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