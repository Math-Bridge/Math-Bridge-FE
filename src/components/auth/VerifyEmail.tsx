import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  
  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setStatus('error');
        setMessage('Invalid verification link. Please try again or request a new verification email.');
        return;
      }
      
      try {
        // Call the API to verify email
        const response = await fetch(`${API_BASE_URL}/auth/verify-email?oobCode=${oobCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in to your account.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || data.message || 'Email verification failed. The link may have expired.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6">
              {status === 'verifying' && (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                  <Loader className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-scale-in">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              )}
              
              {status === 'error' && (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4 animate-scale-in">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {status === 'verifying' && 'Verifying Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </h1>
            
            {/* Message */}
            <p className="text-gray-600 mb-8">
              {message}
            </p>
            
            {/* Actions */}
            <div className="space-y-3">
              {status === 'success' && (
                <>
                  <Link
                    to="/login"
                    className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go to Login
                  </Link>
                  <p className="text-sm text-gray-500">
                    Redirecting automatically in 3 seconds...
                  </p>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <Link
                    to="/signup"
                    className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create New Account
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back to Login
                  </Link>
                </>
              )}
              
              {status === 'verifying' && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
