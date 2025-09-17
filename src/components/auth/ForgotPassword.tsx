import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrors({ general: result.error || 'Failed to send reset email. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'Connection error. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyReset = (oobCode: string) => {
    // Chuyển hướng sang trang reset password với oobCode
    navigate(`/reset-password?oobCode=${oobCode}`);
  };

  if (isSuccess) {
    return (
      <div className="card animate-scale-in text-center">
        <div className="mb-6">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce-slow" />
          </div>
          <h1 className="page-title text-green-900">Email Sent Successfully!</h1>
          <p className="page-subtitle">
            Password reset instructions have been sent to:<br />
            <strong className="text-blue-600">{email}</strong>
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="text-sm font-medium text-blue-900 mb-3">📋 Next Steps:</h4>
            <ol className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-bold">1</span>
                <span>Check your email inbox</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-bold">2</span>
                <span>Click the reset link in the email</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-bold">3</span>
                <span>Create your new password</span>
              </li>
            </ol>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-600 text-sm">
              Didn't receive the email? Check your spam folder.
            </p>
            
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setErrors({});
              }}
              className="w-full btn-secondary"
            >
              Send to different email
            </button>
            
            <Link to="/login" className="block text-center link">
              <ArrowLeft className="inline h-4 w-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-scale-in hover-glow">
      <div className="text-center mb-8">
        <div className="mb-4 relative">
          <span className="text-6xl text-blue-900 animate-pulse-slow">🔑</span>
          <div className="absolute -top-2 -right-2 text-2xl text-blue-600 animate-rotate">∫</div>
        </div>
        <h1 className="page-title animate-fade-in stagger-1">Forgot Password?</h1>
        <p className="page-subtitle animate-fade-in stagger-2">
          Don't worry! We'll help you reset your password • f(reset) = success
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
          <label className="form-label">Email Address</label>
          <div className="relative hover-lift">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input pl-10"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Instructions:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Enter the email you registered with
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              We'll send you a password reset link
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Link expires in 15 minutes
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary hover-lift animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </div>
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>

      <div className="mt-8 text-center animate-fade-in stagger-5">
        <Link to="/login" className="link inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;