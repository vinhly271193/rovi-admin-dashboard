# 🔥 Firebase Setup - Step by Step Guide

## You DON'T Need to Add a Web App!

Good news! Your Firebase project already has the necessary configuration. The iOS app configuration works for web authentication too. Here's how to proceed:

## ✅ Step 1: Enable Google Sign-In

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **rovi-16b3a**
3. In the left menu, click **Authentication**
4. Click the **Sign-in method** tab
5. Find **Google** in the list
6. Click on it and toggle **Enable**
7. For **Project support email**, enter: `vinh2711@googlemail.com`
8. Click **Save**

## ✅ Step 2: Add Authorized Domains

Still in Authentication:
1. Click **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain** and add these:
   - `localhost` (for local testing)
   - `127.0.0.1` (for local testing)  
   - `vinhly271193.github.io` (for GitHub Pages)

## ✅ Step 3: Update Firestore Rules

1. In the left menu, click **Firestore Database**
2. Click **Rules** tab
3. Replace all rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin UID - only you can read
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid == 'byothLpU8SdS5SYpx1UFT0pGT0p1';
    }
    
    // Allow admin to read everything
    match /{document=**} {
      allow read: if isAdmin();
      allow write: if false; // No writes from dashboard
    }
  }
}
```

4. Click **Publish**

## ✅ Step 4: Test Locally

The Firebase config is already updated! Just test it:

```bash
cd /Users/vinhly/Documents/ROVI_Dashboard

# Start a local server
python3 -m http.server 8080

# Or if you have Node.js:
npx http-server -p 8080
```

Open: http://localhost:8080

## ✅ Step 5: Deploy to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Setup Firebase configuration"

# Push to GitHub
git push origin main
```

## ✅ Step 6: Enable GitHub Pages

1. Go to: https://github.com/vinhly271193/rovi-admin-dashboard
2. Click **Settings** (in the repo)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Deploy from a branch
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

Wait 5-10 minutes, then visit:
**https://vinhly271193.github.io/rovi-admin-dashboard**

## 🎯 That's It!

Your dashboard should now work with:
- ✅ Google Sign-In
- ✅ Your existing Firebase data
- ✅ Secure admin-only access

## Troubleshooting

### If Google Sign-In doesn't work:

1. **Check Console Errors**: Press F12 in browser → Console tab

2. **Common Fixes**:
   - Clear browser cache
   - Try incognito/private window
   - Make sure you're signing in with `vinh2711@googlemail.com`

3. **Alternative**: Use the simple auth version:
   - Open `index-simple.html` instead
   - This bypasses Google Sign-In for testing

### If you see "Permission Denied":

This means authentication worked but Firestore rules need updating. Double-check Step 3.

### If GitHub Pages doesn't work:

- Make sure repository is **public**
- Wait full 10 minutes after enabling Pages
- Check: https://github.com/vinhly271193/rovi-admin-dashboard/actions for deployment status

## 🚀 Success Check

You know it's working when:
1. You can sign in with Google
2. You see "Total Users: 7" on the dashboard
3. The user list shows your actual users
4. No red errors in browser console

Need help? The dashboard is already configured correctly - you just need to enable Google Sign-In in Firebase Console!