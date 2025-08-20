# 🔧 Fix "iOS Client Application Blocked" Error

## The Problem
Firebase is blocking requests thinking they're from an iOS app, but you're using a web dashboard.

## Solution 1: Add Your Domain to Firebase (Recommended)

1. **Go to Firebase Console**
   https://console.firebase.google.com/project/rovi-16b3a/authentication/settings

2. **Add Authorized Domains**
   - Scroll to "Authorized domains"
   - Add these domains:
     - `vinhly271193.github.io` (if not already there)
     - `localhost`
     - `127.0.0.1`

3. **Check API Key Restrictions**
   - Go to: https://console.cloud.google.com/apis/credentials?project=rovi-16b3a
   - Click on your Browser API key
   - Under "Application restrictions":
     - Select "HTTP referrers (websites)"
     - Add these referrers:
       - `https://vinhly271193.github.io/*`
       - `http://localhost:8080/*`
       - `http://127.0.0.1:8080/*`
   - Click "Save"

## Solution 2: Check iOS Bundle ID Restrictions

1. **Go to Firebase Console**
   - Project Settings → General
   - Scroll to "Your apps"
   - Check if there's an iOS app configured
   - If yes, check the Bundle ID restrictions

2. **Remove iOS Restrictions (if not needed)**
   - Go to: https://console.cloud.google.com/apis/credentials?project=rovi-16b3a
   - Look for iOS API key
   - Remove bundle ID restrictions or add your domain

## Solution 3: Use a Clean Authentication

I'll create a version that bypasses potential iOS conflicts: