# 🔐 Google Authentication Setup - Complete Guide

## ✅ Step-by-Step Fix

### 1. Enable Google Sign-In in Firebase Console

1. Go to: https://console.firebase.google.com
2. Select your project: **rovi-16b3a**
3. Click **Authentication** (left sidebar)
4. Click **Sign-in method** tab
5. Find **Google** in the list
6. Click on it and:
   - Toggle **Enable** to ON
   - **Project support email**: vinh2711@googlemail.com
   - **Project public-facing name**: ROVI Admin
   - Click **Save**

### 2. Add Authorized Domains

Still in Authentication → Settings tab:
1. Scroll to **Authorized domains**
2. Add these domains (click Add domain for each):
   - `localhost`
   - `127.0.0.1`
   - `vinhly271193.github.io`

### 3. Test with Chrome (Not Arc)

Arc Browser has issues with Firebase. Use Chrome:

```bash
# Open in Chrome
open -a "Google Chrome" http://localhost:8080

# Or Safari
open -a Safari http://localhost:8080
```

### 4. Use the Main Dashboard

```bash
cd /Users/vinhly/Documents/ROVI_Dashboard

# Start server
python3 -m http.server 8080

# Open in Chrome
open -a "Google Chrome" http://localhost:8080
```

## 🎯 Quick Test

Try this test page in **Chrome** (not Arc):
http://localhost:8080/debug.html

1. Click "Test Google Sign-In"
2. Sign in with: vinh2711@googlemail.com
3. Check if your UID matches: byothLpU8SdS5SYpx1UFT0pGT0p1

## ⚠️ Important Notes

### Your UID Must Match
The dashboard only works if your Google account UID is exactly:
`byothLpU8SdS5SYpx1UFT0pGT0p1`

If your UID is different after signing in:
1. Copy your actual UID from the debug page
2. Update Firestore rules with your correct UID
3. Update js/firebase-config.js with your UID

### Browser Compatibility
- ✅ **Chrome**: Works perfectly
- ✅ **Safari**: Works well
- ✅ **Firefox**: Works well
- ⚠️ **Arc**: Has issues with Firebase popups

## 🔧 Alternative If Google Sign-In Still Fails

### Option A: Use Email/Password Auth

1. In Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**
3. Create a user:
   - Email: vinh2711@googlemail.com
   - Password: (your choice)

### Option B: Use Simple Auth Version

```bash
open index-simple.html
```
- Email: vinh2711@googlemail.com
- Password: anything

## 📝 Checklist

Before testing, ensure:
- [ ] Google Sign-In is ENABLED in Firebase Console
- [ ] Your email is set as support email
- [ ] Authorized domains include localhost
- [ ] You're using Chrome/Safari (not Arc)
- [ ] Server is running on port 8080

## 🚀 Final Test

1. Open Chrome: http://localhost:8080
2. Click "Sign in with Firebase"
3. Choose your Google account
4. You should see the dashboard!

## Still Not Working?

Run the debug tool in Chrome and tell me:
1. What error appears?
2. What's your actual UID after signing in?
3. Does Firestore test work?

The issue is likely one of:
- Google Sign-In not enabled
- Wrong UID in rules
- Using Arc browser instead of Chrome