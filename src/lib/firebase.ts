import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
// You'll need to replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}

// Check if Firebase is properly configured
if (firebaseConfig.apiKey === "your-api-key") {
  console.warn('🔥 Firebase not configured! Cloud sync will not work.')
  console.warn('📖 See FIREBASE_QUICK_SETUP.md for setup instructions')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const storage = getStorage(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
