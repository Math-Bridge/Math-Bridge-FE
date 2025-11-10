import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { EventSourcePolyfill } from 'event-source-polyfill';

const SSE_URL = 'https://api.vibe88.tech/api/Notification/sse/connect';

export interface SSENotification {
  id?: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  data?: unknown;
}

interface UseSSENotificationsOptions {
  onNotification?: (notification: SSENotification) => void;
  autoConnect?: boolean;
  showToast?: boolean;
}

export const useSSENotifications = (options: UseSSENotificationsOptions = {}) => {
  const {
    onNotification,
    autoConnect = true,
    showToast = true,
  } = options;

  const { showInfo, showSuccess, showWarning, showError } = useToast();
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const handleNotification = useCallback((notification: SSENotification) => {
    console.log('SSE Notification received:', notification);

    // Call custom handler if provided
    if (onNotification) {
      onNotification(notification);
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = notification.title
        ? `${notification.title}: ${notification.message}`
        : notification.message;

      switch (notification.type) {
        case 'success':
          showSuccess(message);
          break;
        case 'warning':
          showWarning(message);
          break;
        case 'error':
          showError(message);
          break;
        case 'info':
        default:
          showInfo(message);
          break;
      }
    }
  }, [onNotification, showToast, showInfo, showSuccess, showWarning, showError]);

  const connect = useCallback(() => {
    // Don't reconnect if already connected
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSourcePolyfill.CLOSED) {
      console.log('SSE already connected');
      return;
    }

    try {
      console.log('Connecting to SSE:', SSE_URL);

      // Get auth token for authenticated connection
      const token = localStorage.getItem('authToken');
      
      // Create EventSource with Bearer token in Authorization header
      const eventSource = new EventSourcePolyfill(SSE_URL, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        heartbeatTimeout: 120000, // 2 minutes
      });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          // If it's not JSON, treat it as a plain text message
          handleNotification({
            message: event.data,
            type: 'info',
          });
        }
      };

      // Handle specific event types if the server sends them
      eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (error) {
          console.error('Error parsing notification event:', error);
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
    }
  }, [handleNotification]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting SSE');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: eventSourceRef.current?.readyState === EventSourcePolyfill.OPEN,
  };
};

