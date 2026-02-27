# Authentication Setup Guide

## Firebase Authentication Implementation

The application now has complete Firebase authentication setup with proper routing and UI design matching the design system guidelines.

### Features Implemented

1. **Firebase Auth Integration**
   - Email/Password authentication
   - Secure session management
   - Auth state persistence

2. **Pages Created**
   - `/auth/sign-in` - User sign-in page
   - `/auth/sign-up` - User registration page
   - `/dashboard` - Protected dashboard (requires authentication)

3. **Components & Utilities**
   - `AuthProvider` - React Context for global auth state
   - `useAuth()` - Hook to access auth state anywhere in the app
   - `ProtectedRoute` - Component to protect pages from unauthorized access
   - Firebase configuration in `lib/firebase.ts`

### Architecture

```
lib/
├── firebase.ts           # Firebase initialization
├── auth-context.tsx      # Auth provider and context
└── protected-route.tsx   # Protected route wrapper

app/
├── layout.tsx            # Root layout with AuthProvider
├── page.tsx              # Landing page (public)
├── auth/
│   ├── sign-in/
│   │   └── page.tsx      # Sign-in page
│   └── sign-up/
│       └── page.tsx      # Sign-up page
└── dashboard/
    └── page.tsx          # Dashboard (protected)
```

### User Flow

1. **New Users**: Land on homepage → Click "Start Monitoring" → Sign up page → Create account → Redirected to dashboard
2. **Existing Users**: Land on homepage → Click "Sign In" → Enter credentials → Redirected to dashboard
3. **Authenticated Users**: Homepage shows "Dashboard" link instead of "Sign In"

### How It Works

#### AuthProvider Context
Located in `lib/auth-context.tsx`, it:
- Listens to Firebase auth state changes
- Provides user data globally via `useAuth()` hook
- Manages loading state during auth initialization

#### Protected Routes
The `ProtectedRoute` component in `lib/protected-route.tsx`:
- Checks if user is authenticated
- Redirects to sign-in if not authorized
- Shows loading state while checking auth

#### Sign In/Out
- Sign-in page submits email/password to Firebase
- Dashboard has sign-out button
- Automatic redirect on successful auth

### UI/UX Design

All authentication pages follow the design system:
- ✅ Pastel color palette matching design system
- ✅ Soft, minimal aesthetic
- ✅ Rounded components
- ✅ White space and clean layout
- ✅ Smooth Framer Motion animations
- ✅ Error handling with custom UI
- ✅ Loading states

### Usage in Components

Access current user anywhere:

```tsx
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const { user, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

Protect a page:

```tsx
import { ProtectedRoute } from "@/lib/protected-route";

export default function PrivatePage() {
  return (
    <ProtectedRoute>
      <div>This is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

### Environment Variables

Firebase configuration is embedded in `lib/firebase.ts`. For additional security in production, consider using environment variables:

Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... etc
```

Then update `lib/firebase.ts` to use them.

### Testing

1. **Sign Up**: Go to `/auth/sign-up` and create a new account
2. **Sign In**: Go to `/auth/sign-in` with existing credentials
3. **Dashboard**: After auth, you should see `/dashboard`
4. **Sign Out**: Click sign-out button on dashboard, redirects to homepage
5. **Protected Routes**: Try accessing `/dashboard` while signed out - redirects to sign-in

### Error Handling

The app handles:
- Invalid email format
- Weak passwords (< 6 characters)
- Existing email addresses
- Mismatched passwords
- Network errors
- Firebase auth errors

All errors display with the design system's soft red (#FF9C9C) styling.

### Next Steps

Consider implementing:
- Email verification
- Password reset functionality
- Social authentication (Google, GitHub)
- User profile management
- Two-factor authentication
- Session timeout
- Remember me functionality

### Troubleshooting

**Issue**: "Cannot find module '@/lib/firebase'"
- Ensure `jsconfig.json` or `tsconfig.json` has path alias `@/*`

**Issue**: Auth state not persisting
- Check Firebase project settings for anonymous auth enabled

**Issue**: Redirects not working
- Verify `next/navigation` imports are used (not `next/router`)

**Issue**: Firebase errors in console
- Check Firebase console for project setup
- Verify API key and auth domain match your Firebase project
