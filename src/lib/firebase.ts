import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB19RxofbULbOI2rrGa_KoxupYw4HK-fgA",
  authDomain: "tandagallery-29ba8.firebaseapp.com",
  projectId: "tandagallery-29ba8",
  storageBucket: "tandagallery-29ba8.appspot.com",
  messagingSenderId: "1049051019693",
  appId: "1:1049051019693:web:your-app-id" // You'll need to get this from Firebase Console
}

// Check if Firebase is properly configured
if (firebaseConfig.appId === "1:1049051019693:web:your-app-id") {
  console.warn('🔥 Firebase App ID missing! Please get it from Firebase Console.')
  console.warn('📖 Go to Project Settings > Your apps > Web app to get the App ID')
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const storage = getStorage(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
