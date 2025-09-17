import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    console.log('Reset Password - oobCode from URL:', code);
    
    if (!code) {
      setErrors({ general: 'Invalid or expired reset link. Please request a new password reset.' });
    } else {
      setOobCode(code);
      setErrors({});
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const tryMultipleResetFormats = async (oobCode: string, password: string) => {
    const API_BASE_URL = 'https://api.vibe88.tech/api';
    
    const formats = [
      {
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        body: { oobCode, newPassword: password }
      },
      {
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        body: { oob_code: oobCode, new_password: password }
      },
      {
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        body: { token: oobCode, password: password }
      },
      {
        url: `${API_BASE_URL}/auth/reset-password`,
        method: 'POST',
        body: { code: oobCode, newPassword: password }
      },
      {
        url: `${API_BASE_URL}/auth/confirm-reset`,
        method: 'POST',
        body: { oobCode, newPassword: password }
      },
      {
        url: `${API_BASE_URL}/auth/reset-password?oobCode=${oobCode}&newPassword=${password}`,
        method: 'GET',
        body: null
      }
    ];

    for (const format of formats) {
      try {
        console.log(`Trying format: ${format.method} ${format.url}`, format.body);
        
        const response = await fetch(format.url, {
          method: format.method,
          headers: { 'Content-Type': 'application/json' },
          body: format.body ? JSON.stringify(format.body) : undefined
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.text();
          console.log('Success response:', data);
          return { success: true, data };
        }
      } catch (error) {
        console.log(`Format failed:`, error);
        continue;
      }
    }
    
    return { success: false, error: 'Unable to reset password. Please try again or request a new link.' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !oobCode) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('Starting password reset with oobCode:', oobCode);
      
      const response = await apiService.resetPassword({
        oobCode,
        newPassword: formData.password
      });
      
      if (response.success) {
        console.log('Standard API reset successful');
        setIsSuccess(true);
      } else {
        console.log('Standard API failed, trying alternative formats');
        const alternativeResponse = await tryMultipleResetFormats(oobCode, formData.password);
        
        if (alternativeResponse.success) {
          console.log('Alternative format successful');
          setIsSuccess(true);
        } else {
          console.log('All formats failed');
          setErrors({ general: alternativeResponse.error || 'Unable to reset password. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ general: 'Connection error. Please check your internet and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isSuccess) {
    return (
      <div className="card animate-fade-in text-center">
        <div className="mb-6">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce-slow" />
          </div>
          <h1 className="page-title text-green-900">Password Reset Successful! 🎉</h1>
          <p className="page-subtitle">
            Your password has been updated • f(security) = max
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-green-700 mb-2">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Account secured</span>
            </div>
            <p className="text-sm text-green-600">
              You can now log in with your new password.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-primary"
          >
            Continue to login
          </button>
          
          <div className="text-xs text-gray-500">
            For account security, use a strong password and don't share it with anyone.
          </div>
        </div>
      </div>
    );
  }

  if (!oobCode && errors.general) {
    return (
      <div className="card animate-fade-in text-center">
        <div className="mb-6">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto animate-pulse" />
          </div>
          <h1 className="page-title text-red-900">Invalid Link</h1>
          <p className="page-subtitle">
            This reset link is invalid or has expired
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
          
          <Link to="/forgot-password" className="w-full btn-primary inline-block text-center">
            Request new reset link
          </Link>
          
          <Link to="/login" className="block text-center link">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-scale-in hover-glow">
      <div className="text-center mb-8">
        <div className="mb-4 relative">
          <span className="text-6xl text-blue-900 animate-pulse-slow">🔐</span>
          <div className="absolute -top-2 -right-2 text-2xl text-blue-600 animate-rotate">∆</div>
        </div>
        <h1 className="page-title animate-fade-in stagger-1">Reset Password</h1>
        <p className="page-subtitle animate-fade-in stagger-2">
          Create a new secure password • f(security) = max
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in stagger-3">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}
        
        <div>
          <label className="form-label">New Password</label>
          <div className="relative hover-lift">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="form-input pl-10 pr-10"
              placeholder="Enter new password"
              disabled={isLoading}
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

        <div>
          <label className="form-label">Confirm New Password</label>
          <div className="relative hover-lift">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="form-input pl-10 pr-10"
              placeholder="Confirm new password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🔒 Password Requirements:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 6 ? 'bg-green-400' : 'bg-blue-400'}`}></span>
              At least 6 characters
            </li>
            <li className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${/[A-Za-z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'bg-green-400' : 'bg-blue-400'}`}></span>
              Mix of letters and numbers (recommended)
            </li>
            <li className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${formData.password === formData.confirmPassword && formData.password.length > 0 ? 'bg-green-400' : 'bg-blue-400'}`}></span>
              Passwords match
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading || !oobCode}
          className="w-full btn-primary hover-lift animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Resetting...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="mt-8 text-center animate-fade-in stagger-5">
        <p className="text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="link">
            Sign in here →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;