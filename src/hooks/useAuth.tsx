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

// THÊM: mapping RoleId sang role chuỗi cho FE nhận diện đúng phân quyền
// Mapping dựa trên backend: RoleId 2 = tutor, RoleId 3 = parent
type RoleMap = { [k: number]: string };
const roleIdToNameMap: RoleMap = {
  1: 'admin',
  2: 'tutor',  // Backend uses RoleId 2 for tutor
  3: 'parent', // Backend uses RoleId 3 for parent
  4: 'staff',  // Assuming staff might be 4 or another ID
};
function mapRoleIdToRole(roleId: number|undefined): string {
  if (!roleId) return 'user';
  return roleIdToNameMap[roleId] || 'user';
}

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
        // Backend returns: { token: "jwt_token" }
        const token = (response.data as any).token;
        
        if (!token) {
          console.error('Login failed: No token received');
          return { success: false, error: 'No token received from server' };
        }
        
        // Save token first
        localStorage.setItem('authToken', token);
        console.log('Auth token saved to localStorage');
        
        // Decode JWT token to get user ID and info
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Decoded token payload:', payload);
            
            const userId = payload.sub || payload.userId || payload.id || payload.nameid;
            const roleFromToken = payload.role || payload.RoleName || payload.roleName || 'parent';
            const role = roleFromToken.toLowerCase();
            
            if (userId) {
              console.log('User ID from token:', userId);
              
              // Fetch user data from backend
              const userResponse = await apiService.request<any>(`/users/${userId}`);
              if (userResponse.success && userResponse.data) {
                const backendUser = userResponse.data;
                
                // Map role from RoleId if available
                let userRole = role;
                if (backendUser.RoleId || backendUser.roleId) {
                  userRole = mapRoleIdToRole(backendUser.RoleId || backendUser.roleId);
                } else if (backendUser.role || backendUser.Role) {
                  userRole = (backendUser.role || backendUser.Role).toLowerCase();
                }
                
                const user: User = {
                  id: backendUser.userId || backendUser.UserId || userId,
                  email: backendUser.email || backendUser.Email || email,
                  name: backendUser.fullName || backendUser.FullName || email.split('@')[0],
                  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
                  createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
                  role: userRole
                };
                
                console.log('Login successful, user data fetched:', user);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                console.log('User state updated');
                return { success: true };
              } else {
                // If can't fetch user, create minimal user from token
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
            } else {
              console.error('Failed to extract user ID from token');
              return { success: false, error: 'Failed to extract user information from token' };
            }
          } else {
            console.error('Invalid token format');
            return { success: false, error: 'Invalid token format' };
          }
        } catch (tokenError) {
          console.error('Error processing token:', tokenError);
          return { success: false, error: 'Failed to process authentication token' };
        }
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
            
            const userId = payload.sub || payload.userId || payload.id || payload.nameid;
            // Get role from token - backend might use 'RoleName' or 'role' claim
            const roleFromToken = payload.role || payload.RoleName || payload.roleName || 'parent';
            // Convert role name to lowercase for consistency
            const role = roleFromToken.toLowerCase();
            const email = payload.email || payload.Email || '';
            
            if (userId) {
              console.log('User ID from token:', userId);
              
              // Try to get user data from backend using the userId
              const userResponse = await apiService.request<any>(`/users/${userId}`);
              if (userResponse.success && userResponse.data) {
                // Map backend UserResponse to frontend User
                const backendUser = userResponse.data;
                
                // Map role from RoleId if available, otherwise use role from token
                let userRole = role;
                if (backendUser.RoleId || backendUser.roleId) {
                  userRole = mapRoleIdToRole(backendUser.RoleId || backendUser.roleId);
                } else if (backendUser.role || backendUser.Role) {
                  userRole = (backendUser.role || backendUser.Role).toLowerCase();
                }
                
                const user: User = {
                  id: backendUser.userId || backendUser.UserId || userId,
                  email: backendUser.email || backendUser.Email || email,
                  name: backendUser.fullName || backendUser.FullName || email.split('@')[0],
                  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
                  createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
                  role: userRole
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