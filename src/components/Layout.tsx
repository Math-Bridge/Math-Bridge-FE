import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Calculator, User } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="flex min-h-screen">
          {/* Left side - Image */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt="Mathematics and equations"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-blue-900 bg-opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-slide-in-left">
              <div className="text-white text-center">
                <div className="text-8xl mb-4 animate-bounce-slow">∫</div>
                <h2 className="text-3xl font-bold mb-2 animate-fade-in stagger-1">Mathematical Excellence</h2>
                <p className="text-xl opacity-90 animate-fade-in stagger-2">Where equations meet innovation</p>
                <div className="mt-6 text-4xl space-x-4 animate-fade-in stagger-3">
                  <span className="inline-block animate-float stagger-1">π</span>
                  <span className="inline-block animate-pulse-slow stagger-2">∑</span>
                  <span className="inline-block animate-bounce-slow stagger-3">√</span>
                  <span className="inline-block animate-float stagger-4">∞</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-slide-in-right">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/home" className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-blue-900" />
                <span className="text-xl font-bold text-gray-900">MathDash</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="h-5 w-5" />
                <span className="font-medium">∑ Welcome back{user?.name ? `, ${user.name}` : ''}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 math-bg-pattern min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;