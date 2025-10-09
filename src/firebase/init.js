// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDV3m5UUYdSlh6ziLrueUg_FtFnikkmg_Y',
  authDomain: 'fit5032-assignment-23fa4.firebaseapp.com',
  projectId: 'fit5032-assignment-23fa4',
  storageBucket: 'fit5032-assignment-23fa4.firebasestorage.app',
  messagingSenderId: '683008387711',
  appId: '1:683008387711:web:93d40f6d4eff43e600ed4a',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
