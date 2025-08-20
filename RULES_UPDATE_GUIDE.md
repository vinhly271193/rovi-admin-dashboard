# 📝 Firestore Rules Update Guide

## Step-by-Step Instructions

### 1. Copy the Rules
I can see you have the Firestore Rules editor open. You need to **REPLACE ALL** the existing rules with the new ones.

### 2. Delete Everything in the Editor
Select all text (Cmd+A) and delete it.

### 3. Paste These Rules Exactly:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin UID - your Google account
    function isAdmin() {
      return request.auth != null && 
        request.auth.uid == 'byothLpU8SdS5SYpx1UFT0pGT0p1';
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Admin can read all users, users can read/write their own data
      allow read: if isAdmin() || isOwner(userId);
      allow write: if isOwner(userId);
      
      // Subcollections under users (stepsData, activityLog, foodLog, etc.)
      match /stepsData/{document=**} {
        allow read: if isAdmin() || isOwner(userId);
        allow write: if isOwner(userId);
      }
      
      match /activityLog/{document=**} {
        allow read: if isAdmin() || isOwner(userId);
        allow write: if isOwner(userId);
      }
      
      match /foodLog/{document=**} {
        allow read: if isAdmin() || isOwner(userId);
        allow write: if isOwner(userId);
      }
      
      // Allow any other subcollections
      match /{subcollection=**} {
        allow read: if isAdmin() || isOwner(userId);
        allow write: if isOwner(userId);
      }
    }
    
    // Food Database - everyone can read, admin can write
    match /foodDatabase/{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Usernames collection (for unique username checking)
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Friend requests
    match /friendRequests/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Click "Publish"
After pasting the rules, click the **Publish** button.

### 5. Wait for Confirmation
You should see a green message saying "Rules published successfully"

## What These Rules Do:

✅ **Admin Access**: Your UID (`byothLpU8SdS5SYpx1UFT0pGT0p1`) can read ALL user data
✅ **User Privacy**: Regular users can only read/write their own data
✅ **Food Database**: All authenticated users can read foods
✅ **Subcollections**: Properly handles stepsData, activityLog, foodLog

## Test It:

After publishing the rules:

1. Open Chrome (not Arc)
2. Go to: http://localhost:8080/dashboard-authenticated.html
3. Sign in with Google (vinh2711@googlemail.com)
4. You should now see all 7 users and their data!

## Troubleshooting:

If it still shows 0 users after updating rules:

1. **Make sure rules are published** (not just saved)
2. **Wait 1-2 minutes** for rules to propagate
3. **Hard refresh the dashboard** (Cmd+Shift+R)
4. **Check browser console** (F12) for any errors

## Important Note:
The rules I provided match exactly with your Swift app's structure (from DataManager.swift), including:
- `users/{userId}/stepsData`
- `users/{userId}/activityLog`
- `users/{userId}/foodLog`
- `foodDatabase`

This will allow your admin dashboard to read all the data your app creates!