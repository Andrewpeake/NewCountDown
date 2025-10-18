# Firebase Setup for Cloud Persistence

This guide will help you set up Firebase for cloud photo storage in your T+Andrew app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "T+Andrew" (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Required Services

### Storage
1. In Firebase Console, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select a location for your storage bucket
5. Click "Done"

### Authentication (Optional)
1. Go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication (for simple setup)

### Firestore Database
1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select Web (</>) icon
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 4. Update Firebase Configuration

Replace the placeholder values in `src/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
}
```

## 5. Set Up Security Rules

### Storage Rules
Go to Storage > Rules and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      allow read, write: if true; // For development - restrict in production
    }
  }
}
```

### Firestore Rules
Go to Firestore Database > Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read, write: if true; // For development - restrict in production
    }
  }
}
```

## 6. Production Security (Important!)

For production, update the rules to be more secure:

### Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Test the Setup

1. Start your development server: `npm run dev`
2. Go to the Gallery tab
3. Upload a photo
4. Check the sync status - it should show cloud sync options
5. Verify photos appear in Firebase Console > Storage

## 8. Deploy to Production

When deploying to GitHub Pages:

1. Update Firebase config with production settings
2. Set up proper security rules
3. Consider enabling authentication for user-specific data
4. Monitor usage in Firebase Console

## Features Enabled

With this setup, your app will have:

- ✅ **Cloud Photo Storage** - Photos backed up to Firebase Storage
- ✅ **Cross-Device Sync** - Photos sync across all devices
- ✅ **Offline Support** - Works offline, syncs when online
- ✅ **Conflict Resolution** - Handles sync conflicts gracefully
- ✅ **Progress Tracking** - Shows upload/download progress
- ✅ **Error Handling** - Graceful error handling for network issues

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"** - Check your config values
2. **"Permission denied"** - Check your security rules
3. **"Network error"** - Check your internet connection
4. **"Storage quota exceeded"** - Check your Firebase plan

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'firebase:*')
```

## Cost Considerations

- **Firebase Storage**: $0.026/GB/month
- **Firestore**: $0.06/100K reads, $0.18/100K writes
- **Free tier**: 1GB storage, 20K reads/day, 20K writes/day

For a personal photo gallery, you'll likely stay within the free tier.
