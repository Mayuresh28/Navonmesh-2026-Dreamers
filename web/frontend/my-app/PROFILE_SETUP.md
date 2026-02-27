# User Profile Management System

## Overview

A complete user profile setup and management system with aesthetic forms and card-based UI. First-time users are guided through a comprehensive health profile setup, while returning users see their data displayed through beautiful cards with calculated health metrics.

## Features Implemented

### 1. Profile Hook (`lib/profile-hook.ts`)
- **`useProfileData(userId)`** - Main hook for all profile operations
- Manages localStorage for data persistence
- Functions:
  - `profile` - Current user profile data
  - `loading` - Loading state
  - `createProfile()` - Create new profile (first-time users)
  - `updateProfile()` - Update existing profile
  - `hasProfile()` - Check if profile exists
  - `clearProfile()` - Delete profile data

### 2. Profile Data Structure
```typescript
interface UserProfile {
  age: number;
  gender: "male" | "female" | "other";
  height: number;           // cm
  weight: number;           // kg
  familyHistory: string;
  smokingStatus: "never" | "former" | "current";
  alcoholUse: "never" | "occasional" | "moderate" | "heavy";
  existingConditions: string[];
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
}
```

### 3. Profile Setup Page (`/dashboard/profile/setup`)
**For First-Time Users**

Features:
- ✅ Personal Information Section
  - Age (1-150)
  - Gender (Male/Female/Other)
  - Height (50-250 cm)
  - Weight (20-300 kg)

- ✅ Lifestyle Information Section
  - Smoking Status (Never/Former/Current)
  - Alcohol Use (Never/Occasional/Moderate/Heavy)

- ✅ Medical History Section
  - Family History (text input)
  - Existing Conditions (multi-select buttons)
    - Diabetes, Hypertension, Heart Disease, Asthma, Thyroid, Kidney Disease, Liver Disease, Cancer, None

Features:
- Form validation with error messages
- Animated form sections
- Success confirmation with redirect
- Data persisted to localStorage
- Console logging for debugging

### 4. Profile Display Page (`/dashboard/profile`)
**For Returning Users**

Beautiful Card-Based UI showing:

**6 Information Cards:**
1. **Age & Gender Card** - Displays age and gender with Users icon
2. **Height Card** - Height in cm and meters
3. **Weight Card** - Weight in kg with BMI calculation
4. **Smoking Status Card** - Status with health advice
5. **Alcohol Use Card** - Usage level with recommendations
6. **Calorie Burn Card** - Calculated daily calorie needs (uses Harris-Benedict formula)

**Medical History Section:**
- Family History - Text display in background box
- Existing Conditions - Tag-based display with animations

**Additional Features:**
- Edit Profile button - Direct link to setup page
- Sign Out button - Secure logout
- Last updated timestamp
- Automatic redirect if no profile exists

## User Flow

### New User Journey
```
Sign Up → Redirected to Profile Setup → Fill Form → Submit → Success Message → Redirected to Profile Page
```

### Returning User Journey
```
Sign In → Redirected to Profile Page (displays saved data)
```

### Edit Profile
```
Profile Page → Click "Edit Profile" → Setup Page (pre-filled) → Update → Redirected to Profile
```

## Technical Implementation

### Data Persistence
- **Storage Key**: `dhanvantari_user_profile_${userId}` (localStorage)
- **Format**: JSON stringified
- **Fallback**: If no userId provided, uses `dhanvantari_user_profile`

### Auto-Redirect Logic
- Profile setup page redirects to setup if no profile exists
- Sign-in/Sign-up now redirect to `/dashboard/profile` instead of `/dashboard`
- Landing page navigation updated to use profile route

### Form Validation
```
Age: 1-150 years
Height: 50-250 cm
Weight: 20-300 kg
```

### Calculations
**BMI**: weight / (height/100)²
**Daily Calorie Need** (Harris-Benedict Formula):
- Male: 88.362 + 13.397×weight + 4.799×height - 5.677×age
- Female: 447.593 + 9.247×weight + 3.098×height - 4.33×age

## Design System Integration

All pages follow the enhanced design system:
- ✅ Saturated primary blues (#5A7FE8)
- ✅ Vibrant status colors
- ✅ Card-based layout with subtle shadows
- ✅ Framer Motion animations
- ✅ Smooth transitions and micro-interactions
- ✅ Responsive grid layouts
- ✅ Icon integration with Lucide React

### Color Coding
- **Primary (Blue)**: Main information
- **Status Low (Green)**: Positive indicators
- **Status Moderate (Golden)**: Caution
- **Status High (Red)**: Alerts
- **Accent (Light Blue)**: Highlights

## Console Output

When profile is saved, console logs:
```
Profile saved: {
  age: 25,
  gender: "male",
  height: 175,
  weight: 70,
  familyHistory: "Father has diabetes",
  smokingStatus: "never",
  alcoholUse: "occasional",
  existingConditions: ["None"],
  createdAt: "2026-02-27T12:00:00.000Z",
  updatedAt: "2026-02-27T12:00:00.000Z"
}
```

## Usage Examples

### Access User Profile in Any Component
```tsx
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";

function MyComponent() {
  const { user } = useAuth();
  const { profile, loading } = useProfileData(user?.uid);
  
  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile</div>;
  
  return <div>{profile.age} years old</div>;
}
```

### Create New Profile
```tsx
const { createProfile } = useProfileData(userId);

const success = createProfile({
  age: 25,
  gender: "male",
  height: 175,
  weight: 70,
  familyHistory: "None",
  smokingStatus: "never",
  alcoholUse: "occasional",
  existingConditions: ["None"]
});
```

### Update Profile
```tsx
const { updateProfile } = useProfileData(userId);

updateProfile({
  weight: 72,
  smokingStatus: "former"
});
```

### Check If Profile Exists
```tsx
const { hasProfile } = useProfileData(userId);

if (hasProfile()) {
  router.push("/dashboard/profile");
} else {
  router.push("/dashboard/profile/setup");
}
```

## Next Steps

Ready to implement:
1. **MongoDB Integration** - Replace localStorage with cloud storage
2. **Form Pre-filling** - Load existing data in edit mode
3. **Health Metrics Analysis** - Add risk scoring
4. **Medical History Upload** - Documents/reports
5. **Health Timeline** - Track changes over time
6. **Doctor Integration** - Share profiles with healthcare providers
7. **Notifications** - Alert for abnormal values
8. **Health Goals** - Target setting and tracking

## File Structure

```
app/
├── dashboard/
│   ├── page.tsx                 # Main dashboard
│   └── profile/
│       ├── page.tsx             # Profile display (returning users)
│       └── setup/
│           └── page.tsx         # Profile setup (first-time users)

lib/
├── profile-hook.ts             # Profile data management
├── auth-context.tsx            # Auth provider
├── protected-route.tsx         # Route protection
└── firebase.ts                 # Firebase config
```

## Troubleshooting

**Issue**: Profile not saving
- Check browser localStorage is enabled
- Check console for error messages
- Verify userId is being passed

**Issue**: Form validation failing
- Check input values are within ranges
- Review error message displayed
- Ensure all required fields filled

**Issue**: Not redirecting after signup
- Verify Firebase auth successful
- Check profile creation returned true
- Check browser navigation is working

**Issue**: Profile data not persisting
- Clear browser cache/localStorage
- Check `dhanvantari_user_profile_` key exists
- Verify JSON serialization successful
