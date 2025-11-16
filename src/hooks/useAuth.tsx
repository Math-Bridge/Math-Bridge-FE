import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }>;
  signup: (signupData: any) => Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }> => {
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
                
                // Check if user has a placeId or needs phone update
                const userPlaceId = backendUser.placeId || backendUser.PlaceId;
                const userPhoneNumber = backendUser.phoneNumber || backendUser.PhoneNumber;
                const needsLocation = !userPlaceId || userPhoneNumber === 'N/A';

                const user: User = {
                  id: backendUser.userId || backendUser.UserId || userId,
                  email: backendUser.email || backendUser.Email || email,
                  name: backendUser.fullName || backendUser.FullName || email.split('@')[0],
                  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
                  placeId: userPlaceId,
                  formattedAddress: backendUser.formattedAddress || backendUser.FormattedAddress,
                  createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
                  role: userRole
                };
                
                console.log('Login successful, user data fetched:', user);
                console.log('User needs location setup:', needsLocation);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                console.log('User state updated');
                return { success: true, needsLocationSetup: needsLocation };
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
        console.error('Login failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string): Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }> => {
    console.log('useAuth.googleLogin called with token length:', idToken.length);
    setIsLoading(true);
    try {
      const response = await apiService.googleLogin(idToken);
      console.log('Google login API response:', response);
      
      if (response.success && response.data) {
<<<<<<< HEAD
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        // Handle different response formats
        let token: string | null = null;
        let needsLocationSetup: boolean | undefined;
        let userIdFromResponse: string | null = null;
        let roleFromResponse: string | null = null;
        
        if (typeof response.data === 'string') {
          // If response.data is directly the token string
          token = response.data;
          console.log('Token extracted as string, length:', token.length);
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Log the structure to understand what we're dealing with
          console.log('Response.data structure:', response.data);
          console.log('response.data.token type:', typeof response.data.token);
          console.log('response.data.token value:', response.data.token);
          
          // Check if response.data itself has a token property that is a string
          if (typeof response.data.token === 'string') {
            token = response.data.token;
            console.log('Token extracted from response.data.token (string), length:', token.length);
          } else if (response.data.Token && typeof response.data.Token === 'string') {
            token = response.data.Token;
            console.log('Token extracted from response.data.Token (string), length:', token.length);
          } else if (response.data.accessToken && typeof response.data.accessToken === 'string') {
            token = response.data.accessToken;
            console.log('Token extracted from response.data.accessToken (string), length:', token.length);
          } else if (response.data.access_token && typeof response.data.access_token === 'string') {
            token = response.data.access_token;
            console.log('Token extracted from response.data.access_token (string), length:', token.length);
          } else if (response.data.token && typeof response.data.token === 'object') {
            // If token property is an object, try to extract token string from it
            const tokenObj = response.data.token;
            if (typeof tokenObj.token === 'string') {
              token = tokenObj.token;
              console.log('Token extracted from response.data.token.token (string), length:', token.length);
            } else if (tokenObj !== null) {
              // The token property itself is the object with token inside
              // Try to find any string property that looks like a JWT token
              for (const key in tokenObj) {
                const value = tokenObj[key];
                if (typeof value === 'string' && value.length > 100 && value.includes('.')) {
                  // Likely a JWT token (has dots and is long)
                  token = value;
                  console.log(`Token extracted from response.data.token.${key} (string), length:`, token.length);
                  break;
                }
              }
            }
          } else {
            // Try to find token string anywhere in the object
            const findTokenString = (obj: any): string | null => {
              if (typeof obj === 'string' && obj.length > 100) {
                // Likely a JWT token (long string)
                return obj;
              }
              if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                  if (key.toLowerCase().includes('token') && typeof obj[key] === 'string' && obj[key].length > 100) {
                    return obj[key];
                  }
                  const found = findTokenString(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const foundToken = findTokenString(response.data);
            if (foundToken) {
              token = foundToken;
              console.log('Token found recursively in response.data, length:', token.length);
            } else {
              console.log('Available properties in response.data:', Object.keys(response.data));
            }
          }
          
          // Extract other useful info from response
          needsLocationSetup = response.data.needsLocationSetup || response.data.NeedsLocationSetup;
          userIdFromResponse = response.data.userId || response.data.UserId || null;
          roleFromResponse = response.data.role || response.data.Role || null;
        }
        
        if (!token) {
          console.error('Google login failed: No token found in response');
          console.error('Response data:', response.data);
          return { success: false, error: 'No token received from server' };
        }

        // Ensure token is a string
        if (typeof token !== 'string' || !token.trim()) {
          console.error('Google login failed: Invalid token format');
          console.error('Token type:', typeof token);
          console.error('Token value:', token);
          return { success: false, error: 'Invalid token format received from server' };
=======
        // Backend returns nested structure: { data: { token: { token, userId, role, roleId } } }
        const data = response.data as any;
        console.log('Google login response data:', data);
        
        // Handle nested token object
        const tokenData = data.token || data;
        console.log('Token data:', tokenData);
        
        const token = tokenData.token || tokenData.Token;
        const userId = tokenData.userId || tokenData.UserId;
        const roleName = tokenData.role || tokenData.Role;
        const roleId = tokenData.roleId || tokenData.RoleId;

        console.log('Extracted values:', { token: token ? 'exists' : 'missing', userId, roleName, roleId });

        if (!token || typeof token !== 'string') {
          console.error('Google login failed: No valid token received');
          return { success: false, error: 'No token received from server' };
        }

        if (!userId) {
          console.error('Google login failed: No user ID received');
          return { success: false, error: 'No user ID received from server' };
>>>>>>> b669cc52cee7e65e8adc4cc82f23b8053f28f959
        }

        // Save token first
        localStorage.setItem('authToken', token);
        console.log('Auth token saved to localStorage');
        
        // Decode JWT token to get user ID and info (same as regular login)
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
                
                // Check if user has a placeId
                const userPlaceId = backendUser.placeId || backendUser.PlaceId;
                const needsLocation = !userPlaceId;

<<<<<<< HEAD
                const user: User = {
                  id: backendUser.userId || backendUser.UserId || userId,
                  email: backendUser.email || backendUser.Email || payload.email || '',
                  name: backendUser.fullName || backendUser.FullName || payload.name || payload.email?.split('@')[0] || 'User',
                  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
                  placeId: userPlaceId,
                  formattedAddress: backendUser.formattedAddress || backendUser.FormattedAddress,
                  createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
                  role: userRole
                };
                
                console.log('Google login successful, user data fetched:', user);
                console.log('User needs location setup:', needsLocation);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                console.log('User state updated');
                return { success: true, needsLocationSetup: needsLocation || needsLocationSetup };
              } else {
                // If can't fetch user, create minimal user from token
                console.log('Failed to fetch user data, creating from token');
                const user: User = {
                  id: userId,
                  email: payload.email || '',
                  name: payload.name || payload.email?.split('@')[0] || 'User',
                  createdAt: new Date().toISOString(),
                  role: role
                };
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true, needsLocationSetup: needsLocationSetup };
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
=======
        // Map role - use roleId if available, otherwise use roleName directly
        let userRole: string;
        if (roleId) {
          userRole = mapRoleIdToRole(roleId);
        } else if (roleName) {
          userRole = typeof roleName === 'string' ? roleName.toLowerCase() : 'parent';
        } else {
          userRole = 'parent';
        }
        console.log('User ID from response:', userId);
        console.log('User role from response:', roleName, '(ID:', roleId, ') → mapped to:', userRole);
        
        // Fetch full user data from backend
        try {
          const userResponse = await apiService.request<any>(`/users/${userId}`);
          if (userResponse.success && userResponse.data) {
            const backendUser = userResponse.data;
            
            // Check if user has a placeId or needs phone update
            const userPlaceId = backendUser.placeId || backendUser.PlaceId;
            const userPhoneNumber = backendUser.phoneNumber || backendUser.PhoneNumber;
            const needsLocation = !userPlaceId || userPhoneNumber === 'N/A';

            const user: User = {
              id: userId,
              email: backendUser.email || backendUser.Email || '',
              name: backendUser.fullName || backendUser.FullName || 'User',
              phone: userPhoneNumber,
              placeId: userPlaceId,
              formattedAddress: backendUser.formattedAddress || backendUser.FormattedAddress,
              createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
              role: userRole
            };
            
            console.log('Google login successful, user data fetched:', user);
            console.log('User needs location setup:', needsLocation);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            console.log('User state updated');
            return { success: true, needsLocationSetup: needsLocation };
          } else {
            // If can't fetch user, create minimal user from response data
            console.log('Failed to fetch user details, creating minimal user from response');
            const user: User = {
              id: userId,
              email: '', // We don't have email in the response
              name: roleName || 'User',
              createdAt: new Date().toISOString(),
              role: userRole
            };
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            console.log('User state updated with minimal data');
            return { success: true };
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still set minimal user to avoid redirect loop
          const user: User = {
            id: userId,
            email: '',
            name: roleName || 'User',
            createdAt: new Date().toISOString(),
            role: userRole
          };
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          console.log('User state updated with minimal data after error');
          return { success: true };
>>>>>>> b669cc52cee7e65e8adc4cc82f23b8053f28f959
        }
      } else {
        console.error('Google login failed:', response.error);
        return { success: false, error: response.error || 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login network error:', error);
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
        // Return success - user needs to verify email before accessing the app
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

  const refreshUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('User refreshed from localStorage:', parsedUser);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};