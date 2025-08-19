# 🚀 ROVI Dashboard Setup Guide

## Step 1: Fix Git Repository

The Git remote has been updated. Now push to your repository:

```bash
# Check the updated remote
git remote -v

# Create the repository on GitHub first:
# Go to https://github.com/new
# Name: rovi-admin-dashboard
# Make it PUBLIC (for GitHub Pages)
# Don't initialize with README

# Then push your code:
git add .
git commit -m "Initial ROVI Admin Dashboard"
git push -u origin main
```

## Step 2: Configure Firebase for Web

### A. Add Web App to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **rovi-16b3a**
3. Click the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps"
5. Click "Add app" → Web (</> icon)
6. App nickname: "ROVI Admin Dashboard"
7. Check ✅ "Also set up Firebase Hosting"
8. Click "Register app"
9. Copy the config object shown

### B. Update Firebase Config

Replace the config in `/js/firebase-config.js` with the one from Firebase Console:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDrNsSCG2FJ1es4BHe_URbwhuEpkA_5VyU",
    authDomain: "rovi-16b3a.firebaseapp.com",
    projectId: "rovi-16b3a",
    storageBucket: "rovi-16b3a.firebasestorage.app",
    databaseURL: "https://rovi-16b3a-default-rtdb.firebaseio.com",
    messagingSenderId: "677298263090",
    appId: "YOUR_NEW_WEB_APP_ID" // <-- This will be different
};
```

## Step 3: Configure Authentication

### A. Enable Authentication Providers

1. In Firebase Console → Authentication → Sign-in method
2. Enable **Google** provider
3. Add your email as Project support email
4. Save

### B. Add Authorized Domains

1. Still in Authentication → Settings → Authorized domains
2. Add these domains:
   - `localhost` (for testing)
   - `vinhly271193.github.io` (for GitHub Pages)
   - `127.0.0.1` (for local testing)

## Step 4: Configure Firestore Security Rules

Go to Firestore Database → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin UID - only this user can read
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid == 'byothLpU8SdS5SYpx1UFT0pGT0p1';
    }
    
    // Allow admin to read all documents
    match /{document=**} {
      allow read: if isAdmin();
      allow write: if false; // No writes from dashboard
    }
  }
}
```

## Step 5: Test Locally First

```bash
# Install a simple HTTP server
npm install -g http-server

# Run locally
cd /Users/vinhly/Documents/ROVI_Dashboard
http-server -p 8080

# Open in browser
# http://localhost:8080
```

## Step 6: Deploy to GitHub Pages

1. Push to GitHub:
```bash
git add .
git commit -m "Fix Firebase configuration"
git push origin main
```

2. Enable GitHub Pages:
   - Go to your repo: https://github.com/vinhly271193/rovi-admin-dashboard
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

3. Wait 5-10 minutes for deployment

4. Access at: https://vinhly271193.github.io/rovi-admin-dashboard

## Troubleshooting

### "Auth domain not authorized"
- Add `vinhly271193.github.io` to Firebase authorized domains
- Make sure Google Sign-In is enabled

### "Permission denied"
- Check your UID matches in firebase-config.js
- Verify Firestore rules include your UID

### "Repository not found"
- Create the repo on GitHub first
- Make sure it's named exactly: `rovi-admin-dashboard`

### Testing Authentication
1. Open browser console (F12)
2. Try signing in
3. Check for errors in console
4. Your email should be: vinh2711@googlemail.com

## Quick Fixes

If authentication still fails, try:

1. **Use Firebase Hosting Instead** (Alternative):
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

2. **Or use simple email/password auth**:
- Update auth.js to use email/password instead of Google
- Hardcode your credentials (for testing only)

## Need Help?

Check these in order:
1. ✅ Firebase Web App created
2. ✅ Correct config in firebase-config.js
3. ✅ Google Sign-In enabled
4. ✅ Authorized domains added
5. ✅ Firestore rules updated
6. ✅ GitHub Pages enabled

Your dashboard URL will be:
**https://vinhly271193.github.io/rovi-admin-dashboard**