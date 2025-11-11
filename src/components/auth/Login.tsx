import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useTranslation } from '../../hooks/useTranslation';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, googleLogin, isLoading }: {
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }>,
    googleLogin: (idToken: string) => Promise<{ success: boolean; error?: string; needsLocationSetup?: boolean }>,
    isLoading: boolean
  } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = t('emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t('emailInvalid');
    if (!password) newErrors.password = t('passwordRequired');
    else if (password.length < 6) newErrors.password = t('passwordMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrors({}); // Clear previous errors
    const result = await login(email, password);
    if (result.success) {
      // Check if user needs to set up location
      if (result.needsLocationSetup) {
        navigate('/user-profile', { replace: true, state: { needsLocation: true } });
        return;
      }

      // Get user role from localStorage to determine redirect
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          if (user.role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (user.role === 'tutor') {
            navigate('/tutor/dashboard', { replace: true });
          } else if (user.role === 'staff') {
            navigate('/staff', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
        } catch {
          // Fallback to home if parsing fails
          navigate('/home', { replace: true });
        }
      } else {
        navigate('/home', { replace: true });
      }
    } else {
      setErrors({ general: result.error || t('loginFailed') });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Use useAuth.googleLogin instead of direct API call
      const loginResult = await googleLogin(idToken);
      
      if (loginResult.success) {
        // Check if user needs to set up location
        if (loginResult.needsLocationSetup) {
          navigate('/user-profile', { replace: true, state: { needsLocation: true } });
          return;
        }

        // Get user role from localStorage to determine redirect
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            if (user.role === 'admin') {
              navigate("/admin", { replace: true });
            } else if (user.role === 'tutor') {
              navigate("/tutor/dashboard", { replace: true });
            } else if (user.role === 'staff') {
              navigate("/staff", { replace: true });
            } else {
              navigate("/home", { replace: true });
            }
          } catch {
            navigate("/home", { replace: true });
          }
        } else {
          navigate("/home", { replace: true });
        }
      } else {
        setErrors({ general: loginResult.error || "Google login failed" });
      }
    } catch (error) {
      setErrors({ general: error.message || "Google login failed" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="card animate-scale-in hover-glow">
      <div className="text-center mb-8">
        <div className="mb-4 relative">
          <span className="text-6xl text-navy-900 animate-pulse-slow">∫</span>
          <div className="absolute -top-2 -right-2 text-2xl text-navy-600 animate-rotate">π</div>
        </div>
        <h1 className="page-title animate-fade-in stagger-1">Welcome Back</h1>
        <p className="page-subtitle animate-fade-in stagger-2">Calculate your way back in • f(x) = success</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in stagger-3">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{errors.general}</span>
          </div>
        )}
        
        <div>
          <label className="form-label">{t('email')}</label>
          <div className="relative hover-lift">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input pl-10"
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div>
          <label className="form-label">{t('password')}</label>
          <div className="relative hover-lift">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input pl-10 pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-blue-300 text-blue-900 focus:ring-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm link">
            Forgot your password?
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="w-full btn-primary hover-lift animate-glow">
          {isLoading ? 'Signing in...' : t('signIn')}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-4 w-full flex items-center justify-center">
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            className={`w-full flex items-center justify-center px-4 py-3 border border-navy-200 rounded-lg bg-white text-gray-700 
              hover:bg-navy-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 hover-lift 
              ${isGoogleLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isGoogleLoading ? (
              <span className="text-gray-500">Connecting...</span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('signInWithGoogle')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center animate-fade-in stagger-5">
        <p className="text-gray-600">
          {t('dontHaveAccount')}{' '}
          <Link to="/signup" className="link">
            {t('signUp')} →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
