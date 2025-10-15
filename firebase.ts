import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3Cr2fJx5EVbI_b-WzR34FUznQnYcZfs8",
  authDomain: "mansolin-poker.firebaseapp.com",
  projectId: "mansolin-poker",
  storageBucket: "mansolin-poker.firebasestorage.app",
  messagingSenderId: "734092091177",
  appId: "1:734092091177:web:cb23dfc025856f44812138"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };