import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB19RxofbULbOI2rrGa_KoxupYw4HK-fgA",
  authDomain: "tandagallery-29ba8.firebaseapp.com",
  projectId: "tandagallery-29ba8",
  storageBucket: "tandagallery-29ba8.firebasestorage.app",
  messagingSenderId: "1049051019693",
  appId: "1:1049051019693:web:e89c11c80e5c9844e54924",
  measurementId: "G-TL5WL6N079"
}

// Firebase is now properly configured! 🎉

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const storage = getStorage(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
