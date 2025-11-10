import React from 'react';
import { useSSENotifications } from '../../hooks/useSSENotifications';

/**
 * SSENotificationTest - A test component to manually test SSE notifications
 * This component can be added to any page to test the notification system
 */
export const SSENotificationTest: React.FC = () => {
  const { connect, disconnect, isConnected } = useSSENotifications({
    autoConnect: false,
    showToast: true,
    onNotification: (notification) => {
      console.log('Test component received notification:', notification);
    },
  });

  const simulateNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
    // This simulates what would happen when the server sends a notification
    const messages = {
      info: { title: 'Information', message: 'This is an informational message' },
      success: { title: 'Success', message: 'Operation completed successfully!' },
      warning: { title: 'Warning', message: 'Please check your account balance' },
      error: { title: 'Error', message: 'Something went wrong, please try again' },
    };

    console.log('Simulating notification:', messages[type]);
    
    // In a real scenario, this would come from the SSE connection
    // For testing, we're just logging what would be received
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">SSE Notification Test Panel</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Connection Status: 
          <span className={`ml-2 font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={connect}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect SSE
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Disconnect SSE
        </button>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-2">Simulate Notifications:</h4>
        <p className="text-xs text-gray-500 mb-3">
          Note: These buttons show how notifications would appear. 
          Real notifications come from the server via SSE.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => simulateNotification('info')}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Test Info
          </button>
          <button
            onClick={() => simulateNotification('success')}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Test Success
          </button>
          <button
            onClick={() => simulateNotification('warning')}
            className="px-3 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
          >
            Test Warning
          </button>
          <button
            onClick={() => simulateNotification('error')}
            className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Test Error
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <p className="font-semibold mb-1">How to test with real server:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Click "Connect SSE" button above</li>
          <li>Send a notification from your server to: https://api.vibe88.tech/api/Notification/sse/connect</li>
          <li>The notification should appear as a toast popup</li>
          <li>Check browser console for connection logs</li>
        </ol>
      </div>
    </div>
  );
};

export default SSENotificationTest;

