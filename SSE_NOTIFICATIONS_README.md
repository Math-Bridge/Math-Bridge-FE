# SSE Notification System

## Overview
The SSE (Server-Sent Events) notification system provides real-time push notifications from the server to the client. When the server sends a notification via SSE, it automatically appears as a pop-up toast notification in the application.

## Features
- ✅ Automatic connection when user is authenticated
- ✅ Automatic disconnection when user logs out
- ✅ Toast notifications for all incoming messages
- ✅ Browser notifications support (with permission)
- ✅ Automatic reconnection with exponential backoff
- ✅ Type-safe notification handling
- ✅ Customizable notification handlers

## Implementation

### 1. Hook: `useSSENotifications`
Located at: `src/hooks/useSSENotifications.tsx`

Custom React hook that manages SSE connection and handles incoming notifications.

**Features:**
- Auto-connect/manual connect modes
- Automatic toast display
- Custom notification handlers
- Reconnection logic (up to 5 attempts with exponential backoff)
- Type-safe notification interface

**Usage:**
```typescript
import { useSSENotifications } from '../hooks/useSSENotifications';

// Basic usage with auto-connect
const { connect, disconnect, isConnected } = useSSENotifications({
  autoConnect: true,
  showToast: true,
  onNotification: (notification) => {
    console.log('Received:', notification);
  }
});

// Manual control
const { connect, disconnect } = useSSENotifications({
  autoConnect: false,
  onNotification: (notification) => {
    // Custom handling
    if (notification.type === 'urgent') {
      playAlertSound();
    }
  }
});

// Connect manually
useEffect(() => {
  connect();
  return () => disconnect();
}, []);
```

### 2. Provider: `SSENotificationProvider`
Located at: `src/components/common/SSENotificationProvider.tsx`

React context provider that automatically manages SSE connection based on authentication state.

**Features:**
- Connects when user logs in
- Disconnects when user logs out
- Requests browser notification permission
- Shows both toast and browser notifications

**Integration in App.tsx:**
```typescript
<AuthProvider>
  <SSENotificationProvider>
    <Routes>
      {/* Your routes */}
    </Routes>
  </SSENotificationProvider>
</AuthProvider>
```

### 3. Server Connection
- **Endpoint:** `https://api.vibe88.tech/api/Notification/sse/connect`
- **Authentication:** Sends token as query parameter if available
- **Connection:** Automatically includes auth token from localStorage

## Notification Format

### Expected SSE Message Format
The server should send notifications in JSON format:

```json
{
  "id": "notification-123",
  "title": "New Message",
  "message": "You have a new message from tutor",
  "type": "info",
  "timestamp": "2025-11-10T10:30:00Z",
  "data": {
    "messageId": "msg-456",
    "senderId": "user-789"
  }
}
```

### Notification Types
- `info` - Blue toast (default)
- `success` - Green toast
- `warning` - Yellow/orange toast
- `error` - Red toast

### Minimum Required Fields
```json
{
  "message": "Your notification message"
}
```

All other fields are optional.

## Toast Notification Display

When a notification is received, it automatically appears as a toast notification with:
- Duration: 4-6 seconds (varies by type)
- Position: Top-right corner
- Styling: Color-coded by type
- Animation: Slide in from right, fade out

## Browser Notifications

The system also supports browser notifications (desktop/mobile):
- Automatically requests permission on first load
- Shows native OS notifications when tab is not focused
- Includes notification title, message, and app icon
- Clicking notification brings focus to the app tab

## Testing

### Manual Testing
1. Log in to the application
2. Check browser console for: "Connecting to SSE: https://api.vibe88.tech/api/Notification/sse/connect"
3. Check for: "SSE connection opened"
4. Send a test notification from the server
5. Verify toast notification appears

### Testing with curl
```bash
# If your server supports manual notification triggering
curl -X POST https://api.vibe88.tech/api/Notification/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test",
    "type": "info"
  }'
```

### Console Commands
Open browser console and run:
```javascript
// Check if EventSource is supported
console.log('EventSource supported:', 'EventSource' in window);

// Check notification permission
console.log('Notification permission:', Notification.permission);
```

## Troubleshooting

### Connection Not Establishing
1. Check network tab in browser DevTools
2. Look for SSE connection to `/api/Notification/sse/connect`
3. Verify authentication token is valid
4. Check server logs for connection attempts

### Notifications Not Appearing
1. Check browser console for errors
2. Verify SSE message format is correct JSON
3. Check if ToastContext is properly configured
4. Verify SSENotificationProvider is wrapping the app

### Browser Notifications Not Working
1. Check notification permission: `Notification.permission`
2. Grant permission when prompted
3. Verify browser supports Notifications API
4. Check browser notification settings

## Architecture

```
┌─────────────────────────────────────────────┐
│           App Component Tree                │
│  ┌───────────────────────────────────────┐  │
│  │       AuthProvider                    │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  SSENotificationProvider        │  │  │
│  │  │  - Monitors auth state          │  │  │
│  │  │  - Connects/disconnects SSE     │  │  │
│  │  │  ┌───────────────────────────┐  │  │  │
│  │  │  │  useSSENotifications hook │  │  │  │
│  │  │  │  - Manages EventSource    │  │  │  │
│  │  │  │  - Handles messages       │  │  │  │
│  │  │  │  - Reconnects on error    │  │  │  │
│  │  │  └───────────────────────────┘  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   ToastContext       │
        │   - Shows toast      │
        │   - Manages queue    │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Browser Notification│
        │   - Native popup     │
        └──────────────────────┘
```

## Future Enhancements

Potential improvements:
- [ ] Sound notifications
- [ ] Notification history/center
- [ ] Notification preferences/settings
- [ ] Different channels/topics
- [ ] Notification actions (buttons in notifications)
- [ ] Offline notification queue
- [ ] Notification badges
- [ ] Custom notification templates
- [ ] Rich media in notifications (images, etc.)

## Server-Side Requirements

The backend SSE endpoint should:
1. Accept authenticated connections
2. Keep connection alive with heartbeat/ping messages
3. Send properly formatted JSON notifications
4. Handle connection timeouts gracefully
5. Support CORS for the frontend domain
6. Return proper SSE headers:
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   ```

## Example Server Response Format
```
data: {"message":"New notification","type":"info"}

data: {"title":"Session Reminder","message":"Your session starts in 15 minutes","type":"warning"}

data: {"title":"Payment Received","message":"Payment of $50 received","type":"success"}
```

