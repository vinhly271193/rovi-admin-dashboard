# 🚨 CRITICAL FIX: Remove iOS Restrictions from API Key

## The Problem
Your Firebase API key is restricted to iOS apps only, blocking ALL web access.

## IMMEDIATE FIX REQUIRED

### Step 1: Go to Google Cloud Console
**Click this link:**
https://console.cloud.google.com/apis/credentials?project=rovi-16b3a

### Step 2: Find Your API Keys
You'll see multiple API keys. Look for:
- **Browser key (auto created by Firebase)**
- **iOS key (auto created by Firebase)** 
- Any key with value: `AIzaSyDrNsSCG2FJ1es4BHe_URbwhuEpkA_5VyU`

### Step 3: Remove iOS Restrictions
For EACH API key:

1. **Click on the API key name**
2. Look at **"Application restrictions"**
3. If it says **"iOS apps"** → Change to **"None"**
4. If it says **"HTTP referrers"** → Make sure these are added:
   - `https://vinhly271193.github.io/*`
   - `https://*.firebaseapp.com/*`
   - `http://localhost:8080/*`
5. **Click SAVE**

### Step 4: Wait 1-2 Minutes
API key changes take a minute to propagate.

## Alternative: Create New Web API Key

If changing existing keys doesn't work:

1. In Google Cloud Console, click **"+ CREATE CREDENTIALS"**
2. Choose **"API key"**
3. Name it: **"ROVI Web Dashboard Key"**
4. Set restrictions:
   - Application restrictions: **HTTP referrers**
   - Add these websites:
     - `https://vinhly271193.github.io/*`
     - `http://localhost:8080/*`
5. Copy the new API key
6. I'll create a dashboard using this new key

## Quick Test After Fix

Once you've removed iOS restrictions, test here:
https://vinhly271193.github.io/rovi-admin-dashboard/dashboard-authenticated.html

The error should be gone!

## Why This Happened

When you created your ROVI iOS app in Firebase, it automatically:
1. Created an iOS-restricted API key
2. Set the main API key to iOS-only
3. This blocks ALL web access

## If Still Blocked

Tell me the exact text under "Application restrictions" for your API key, and I'll provide specific steps.