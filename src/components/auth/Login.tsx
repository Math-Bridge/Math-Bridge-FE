import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Login attempt:', { email, passwordLength: password.length });
    
    if (!validateForm()) return;
    
    const result = await login(email, password);
    
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('Login successful, navigating to /home');
      navigate('/home', { replace: true });
    } else {
      console.log('Login failed:', result.error);
      setErrors({ general: result.error || 'Login failed' });
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}
        
        <div>
          <label className="form-label">Email Address</label>
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
          <label className="form-label">Password</label>
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
            <input
              type="checkbox"
              className="rounded border-blue-300 text-blue-900 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm link">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary hover-lift animate-glow"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
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
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                const result = await googleLogin(credentialResponse.credential);
                if (result.success && result.token) {
                  localStorage.setItem('accessToken', result.token);
                  navigate('/home', { replace: true });
                } else {
                  setErrors({ general: result.error || 'Google login failed' });
                }
              } else {
                setErrors({ general: 'Google login failed' });
              }
            }}
            onError={() => setErrors({ general: 'Google login failed' })}
            width="100%"
          />
        </div>
      </div>

      <div className="mt-8 text-center animate-fade-in stagger-5">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="link">
            Sign up here →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;