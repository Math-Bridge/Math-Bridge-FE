import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CustomerSupportButton from './CustomerSupportButton';
import { useAuth } from '../../hooks/useAuth';
import { useHideIdInUrl } from '../../hooks/useHideIdInUrl';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  useHideIdInUrl(); // Hide ID in URL bar for all routes
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isUnauthorizedPage = location.pathname === '/unauthorized';

  const userRole = user?.role ?? '';

  // Hide header for admin, staff, and tutor roles
  const shouldHideHeader = userRole === 'admin' || userRole === 'staff' || userRole === 'tutor';

  // Only show AI chat support to roles that should have access (e.g., parents/guests)
  const shouldShowSupportButton = !['admin', 'staff', 'tutor'].includes(userRole);

  if (isUnauthorizedPage) {
    return <Outlet />;
  }

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
            <div className="absolute inset-0 bg-primary-dark bg-opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-slide-in-left">
              <div className="text-white text-center">
                <div className="text-8xl mb-4 animate-bounce-slow">∫</div>
                <h2 className="text-3xl font-bold mb-2 animate-fade-in stagger-1">MathBridge</h2>
                <p className="text-xl opacity-90 animate-fade-in stagger-2">Connect with high quality math tutors</p>
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

        {/* Customer Support Chat Button */}
        {shouldShowSupportButton && <CustomerSupportButton />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!shouldHideHeader && <Header />}
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      {!shouldHideHeader && <Footer />}

      {/* Customer Support Chat Button */}
      {shouldShowSupportButton && <CustomerSupportButton />}
    </div>
  );
};
export default Layout;