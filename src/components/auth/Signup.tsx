import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, User, Eye, EyeOff, Phone, UserCheck, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../contexts/ToastContext';

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const resendVerification = async (email: string) => {
    try {
      const response = await fetch('https://api.vibe88.tech/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email })
      });
      if (response.ok) {
        showSuccess(t('verificationEmailSentAgain'));
      } else {
        showError(t('failedToResendVerification'));
      }
    } catch (error) {
      showError(t('errorResendingEmail'));
    }
  };
  const [formData, setFormData] = useState({
    FullName: '',
    Email: '',
    Password: '',
    confirmPassword: '',
    PhoneNumber: '',
    Gender: '',
    RoleId: 2147483647
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showVerification, setShowVerification] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.FullName) {
      newErrors.FullName = t('fullNameRequired');
    }
    if (!formData.Email) {
      newErrors.Email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = t('emailInvalid');
    }
    if (!formData.Password) {
      newErrors.Password = t('passwordRequired');
    } else if (formData.Password.length < 6) {
      newErrors.Password = t('passwordMinLength');
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPassword');
    } else if (formData.Password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }
    if (formData.PhoneNumber && !/^[0-9+\-\s()]+$/.test(formData.PhoneNumber)) {
      newErrors.PhoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await signup({
      FullName: formData.FullName,
      Email: formData.Email,
      Password: formData.Password,
      PhoneNumber: formData.PhoneNumber,
      Gender: formData.Gender,
      RoleId: formData.RoleId
    });
    
    if (result.success) {
      setUserEmail(formData.Email);
      setShowVerification(true);
    } else {
      setErrors({ general: result.error || 'Signup failed' });
    }
  };

  if (showVerification) {
    return (
      <div className="card animate-fade-in text-center">
        <div className="mb-6">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-pulse-slow" />
          </div>
          <h1 className="page-title">Verify Your Email</h1>
          <p className="page-subtitle">
            Account created successfully!<br />
            Please check your email to verify your account.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            📧 We've sent a verification email to:<br />
            <strong className="text-blue-900">{userEmail}</strong>
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Didn't receive the email? Check your spam folder or click below to resend.
          </p>
          
          <button
            onClick={() => {
              resendVerification(userEmail);
            }}
            className="w-full btn-secondary"
          >
            Resend Verification Email
          </button>
          
          <Link to="/login" className="block text-center link">
            Continue to Sign In →
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="card animate-scale-in hover-glow">
      <div className="text-center mb-8">
        <div className="mb-4 relative">
          <span className="text-6xl text-navy-900 animate-bounce-slow">∑</span>
          <div className="absolute -top-2 -right-2 text-2xl text-navy-600 animate-math-symbols">∞</div>
        </div>
        <h1 className="page-title animate-fade-in stagger-1">{t('createAccount')}</h1>
        <p className="page-subtitle animate-fade-in stagger-2">Join the equation • ∀x ∈ Users</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in stagger-3">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}
        
        <div>
          <label className="form-label">{t('fullName')}</label>
          <div className="relative hover-lift">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="FullName"
              value={formData.FullName}
              onChange={handleChange}
              className="form-input pl-10"
              placeholder="Enter your full name"
            />
          </div>
          {errors.FullName && <p className="error-message">{errors.FullName}</p>}
        </div>

        <div>
          <label className="form-label">{t('email')}</label>
          <div className="relative hover-lift">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className="form-input pl-10"
              placeholder="Enter your email"
            />
          </div>
          {errors.Email && <p className="error-message">{errors.Email}</p>}
        </div>

        <div>
          <label className="form-label">{t('phoneNumber')}</label>
          <div className="relative hover-lift">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="tel"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              onChange={handleChange}
              className="form-input pl-10"
              placeholder="Enter your phone number"
            />
          </div>
          {errors.PhoneNumber && <p className="error-message">{errors.PhoneNumber}</p>}
        </div>

        <div>
          <label className="form-label">{t('gender')}</label>
          <div className="relative hover-lift">
            <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              name="Gender"
              value={formData.Gender}
              onChange={handleChange}
              className="form-input pl-10"
            >
              <option value="">Select gender</option>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">{t('password')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="Password"
              value={formData.Password}
              onChange={handleChange}
              className="form-input pl-10 pr-10"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.Password && <p className="error-message">{errors.Password}</p>}
        </div>

        <div>
          <label className="form-label">{t('confirmPassword')}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input pl-10 pr-10"
              placeholder="Confirm your password"
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

        <div className="flex items-center">
          <input
            type="checkbox"
            required
            className="rounded border-blue-300 text-blue-900 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="link">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="link">Privacy Policy</a>
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary hover-lift animate-glow"
        >
          {isLoading ? 'Creating account...' : t('createAccount')}
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
        
        <button
          type="button"
          className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-blue-200 rounded-lg bg-white text-gray-700 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Gmail
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="link">
            {t('signInHere')} →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;