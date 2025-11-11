# Location Redirect Implementation

## Overview
This document describes the implementation of automatic redirection to the user profile page when a user's `placeId` is null, requiring them to set up their address before accessing other parts of the application.

## Implementation Date
November 10, 2025

## Changes Made

### 1. Updated `useAuth.tsx` Hook
**File**: `/src/hooks/useAuth.tsx`

#### Changes in `login` function:
- Added check for `placeId` from the user data fetched from the API
- Store `placeId` and `formattedAddress` in the user object
- Return `needsLocationSetup: true` when `placeId` is null
- Log location setup status for debugging

#### Changes in `googleLogin` function:
- Added same `placeId` check as in `login` function
- Store `placeId` and `formattedAddress` in the user object
- Return `needsLocationSetup: true` when `placeId` is null
- Consistent behavior with regular login

**Key Code Addition:**
```typescript
// Check if user has a placeId
const userPlaceId = backendUser.placeId || backendUser.PlaceId;
const needsLocation = !userPlaceId;

const user: User = {
  id: backendUser.userId || backendUser.UserId || userId,
  email: backendUser.email || backendUser.Email || email,
  name: backendUser.fullName || backendUser.FullName || email.split('@')[0],
  phone: backendUser.phoneNumber || backendUser.PhoneNumber,
  placeId: userPlaceId,
  formattedAddress: backendUser.formattedAddress || backendUser.FormattedAddress,
  createdAt: backendUser.createdDate || backendUser.CreatedDate || new Date().toISOString(),
  role: userRole
};

return { success: true, needsLocationSetup: needsLocation };
```

### 2. Updated `App.tsx` - Protected Route
**File**: `/src/App.tsx`

#### Changes to `ProtectedRoute` component:
- Added `skipLocationCheck` prop (default: `false`)
- Added location check that redirects to `/user-profile` if `placeId` is null
- Profile pages use `skipLocationCheck={true}` to allow access for location setup

**Key Code Addition:**
```typescript
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requiredRole?: string | string[]; 
  skipLocationCheck?: boolean 
}> = ({ children, requiredRole, skipLocationCheck = false }) => {
  // ...existing auth checks...
  
  // Check if user needs to set up location (skip for profile pages)
  if (!skipLocationCheck && user && !user.placeId) {
    console.log('User missing placeId, redirecting to profile for location setup');
    return <Navigate to="/user-profile" replace state={{ needsLocation: true }} />;
  }
  
  return <>{children}</>;
};
```

#### Updated Routes:
```typescript
<Route path="user-profile" element={
  <ProtectedRoute skipLocationCheck={true}>
    <ParentProfilePage />
  </ProtectedRoute>
} />
<Route path="parent-profile" element={
  <ProtectedRoute skipLocationCheck={true}>
    <ParentProfilePage />
  </ProtectedRoute>
} />
```

### 3. Updated `ParentProfile.tsx`
**File**: `/src/components/features/parent/ParentProfile.tsx`

#### Changes to `fetchUserData` function:
- Update user in localStorage with `placeId` and `formattedAddress` after fetching
- Automatically hide location banner when address is set
- Keep user context synchronized across the app

**Key Code Addition:**
```typescript
// Update user in localStorage with placeId
const savedUser = localStorage.getItem('user');
if (savedUser) {
  try {
    const parsedUser = JSON.parse(savedUser);
    const updatedUser = {
      ...parsedUser,
      placeId: userData.placeId || userData.PlaceId,
      formattedAddress: userAddress
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('Updated user in localStorage with placeId:', updatedUser.placeId);
    
    // Hide location banner if address is now set
    if (userAddress && showLocationBanner) {
      setShowLocationBanner(false);
    }
  } catch (err) {
    console.error('Error updating localStorage:', err);
  }
}
```

### 4. Updated Type Definitions
**Files**: 
- `/src/types/index.ts`
- `/src/services/api.ts`

#### Added to User interface:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  formattedAddress?: string;  // Added
  placeId?: string;            // Added
  createdAt: string;
  role?: string;
}
```

## User Flow

### First Time User / User Without Location:
1. User logs in (email/password or Google)
2. System checks if `placeId` exists
3. If `placeId` is null:
   - `login`/`googleLogin` returns `needsLocationSetup: true`
   - User is redirected to `/user-profile` with `needsLocation: true` state
   - Location banner is displayed
   - Profile is automatically in edit mode
   - User must enter and select their address
4. After saving address:
   - `placeId` is stored in the database
   - User object in localStorage is updated
   - User can now access all protected routes

### Existing User With Location:
1. User logs in
2. System checks if `placeId` exists
3. If `placeId` exists:
   - User is redirected to their role-appropriate dashboard
   - No location setup required

### Navigation Protection:
- All protected routes check for `placeId` before rendering
- If user somehow navigates without `placeId`, they're redirected to profile
- Profile pages skip this check to allow location setup
- After setting location and refreshing user data, user can navigate freely

## API Integration

### Login/Google Login Response:
The system expects the API to return user data with these fields:
```json
{
  "userId": "uuid",
  "fullName": "User Name",
  "email": "user@example.com",
  "phoneNumber": "1234567890",
  "placeId": "ChIJ...",  // Google Place ID or null
  "formattedAddress": "Full address string"
}
```

### Location Save:
When user selects a location, the system:
1. Calls `/api/location/save` with the `placeId`
2. Backend stores the `placeId` and formatted address
3. Fetches updated user data
4. Updates localStorage and app state

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Login with null placeId redirects to profile
- [ ] Login with valid placeId goes to dashboard
- [ ] Google login with null placeId redirects to profile
- [ ] Google login with valid placeId goes to dashboard
- [ ] Profile page shows location banner when needsLocation is true
- [ ] After saving location, user can access other routes
- [ ] Direct navigation to protected routes redirects if no placeId
- [ ] Profile pages are accessible without placeId
- [ ] Location banner disappears after setting address

## Benefits

1. **User Experience**: Seamless onboarding flow for new users
2. **Data Quality**: Ensures all users have location data before using location-based features
3. **Security**: Prevents incomplete user profiles from accessing full features
4. **Maintainability**: Centralized location check in ProtectedRoute component
5. **Flexibility**: Easy to skip location check for specific routes using `skipLocationCheck` prop

## Notes

- The location banner in ParentProfile already existed and handles the UI/UX
- The `needsLocationSetup` flag was already defined in the auth context interface
- Login.tsx and Signup.tsx already had logic to handle `needsLocationSetup`
- This implementation extends existing functionality rather than replacing it
- All changes are backward compatible with existing code

