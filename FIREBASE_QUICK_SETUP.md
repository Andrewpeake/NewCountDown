# Quick Firebase Setup for T+Andrew

## Step 1: Create Firebase Project (5 minutes)

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project name**: `t-andrew-photos` (or any name you prefer)
4. **Enable Google Analytics**: No (optional)
5. **Click "Create project"**

## Step 2: Enable Required Services (3 minutes)

### Enable Storage:
1. In Firebase Console, click **"Storage"** in left sidebar
2. Click **"Get started"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to you)
5. Click **"Done"**

### Enable Firestore:
1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select same location as Storage
5. Click **"Done"**

## Step 3: Get Your Firebase Config (2 minutes)

1. **Click the gear icon** (⚙️) next to "Project Overview"
2. **Scroll down to "Your apps"**
3. **Click the web icon** (</>)
4. **App nickname**: `t-andrew-web`
5. **Check "Also set up Firebase Hosting"** (optional)
6. **Click "Register app"**
7. **Copy the config object** (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "t-andrew-photos.firebaseapp.com",
  projectId: "t-andrew-photos",
  storageBucket: "t-andrew-photos.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

## Step 4: Update Your App (1 minute)

1. **Open** `src/lib/firebase.ts`
2. **Replace the placeholder config** with your actual config
3. **Save the file**

## Step 5: Test Cloud Sync (2 minutes)

1. **Start your app**: `npm run dev`
2. **Go to Gallery tab**
3. **Upload a photo**
4. **Check the sync status** - should show cloud indicators
5. **Open the same app on another device/browser**
6. **Photos should sync automatically!**

## Troubleshooting

### If sync doesn't work:
1. **Check browser console** for Firebase errors
2. **Verify your config** matches exactly
3. **Make sure Storage and Firestore are enabled**
4. **Check that you're online**

### If you see "Permission denied":
1. **Go to Storage > Rules**
2. **Replace with**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      allow read, write: if true;
    }
  }
}
```

3. **Go to Firestore > Rules**
4. **Replace with**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read, write: if true;
    }
  }
}
```

## What You'll Get

✅ **Photos sync across all devices**
✅ **Offline support** - works without internet
✅ **Automatic backup** - photos stored in cloud
✅ **Cross-device access** - same photos everywhere
✅ **Free tier** - 1GB storage, 20K operations/day

## Cost

- **Free tier**: 1GB storage, 20K reads/writes per day
- **Perfect for personal photo galleries**
- **No credit card required**

---

**Total setup time: ~10 minutes**
**Your photos will sync across all devices!** 🚀
