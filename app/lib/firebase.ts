import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBR0yPHi3ZyoDn9nWly8Xkcq3zO4ZmnjTU",
  authDomain: "verdant-ideas.firebaseapp.com",
  projectId: "verdant-ideas",
  storageBucket: "verdant-ideas.firebasestorage.app",
  messagingSenderId: "671213178177",
  appId: "1:671213178177:web:34e1af10a53b3b57d0e5c0",
  measurementId: "G-FH1BPDR3QG",
};

const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (browser only)
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      getAnalytics(app);
    }
  });
}

export default app;