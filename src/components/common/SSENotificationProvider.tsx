import React, { useEffect } from 'react';
import { useSSENotifications } from '../../hooks/useSSENotifications';
import { useAuth } from '../../hooks/useAuth';

/**
 * SSENotificationProvider - Manages real-time SSE notifications
 * This component automatically connects to SSE when user is authenticated
 * and displays notifications as toast popups
 */
export const SSENotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Connect to SSE only when user is authenticated
  const { connect, disconnect } = useSSENotifications({
    autoConnect: false, // We'll control the connection manually based on auth
    showToast: true, // Show toast notifications automatically
    onNotification: (notification) => {
      // Optional: Add custom handling for specific notification types
      console.log('Notification received:', notification);
      
      // You can add custom logic here, such as:
      // - Playing a sound
      // - Showing browser notifications
      // - Updating application state
      // - Triggering data refresh
      
      // Example: Browser notification (requires permission)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/favicon.png',
          tag: notification.id,
        });
      }
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, connecting to SSE notifications');
      connect();
    } else {
      console.log('User not authenticated, disconnecting SSE notifications');
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  // Request browser notification permission on mount (if not already granted)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  return <>{children}</>;
};

