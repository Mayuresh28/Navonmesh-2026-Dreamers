import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCVa3W2L6VWAtwESTp9Zp-s5BPORSrN0cM",
  authDomain: "dhanvantari-38847.firebaseapp.com",
  projectId: "dhanvantari-38847",
  storageBucket: "dhanvantari-38847.firebasestorage.app",
  messagingSenderId: "347260256647",
  appId: "1:347260256647:web:d793a9dde33a10ffe79322",
  measurementId: "G-S4WRYGQBM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics only on client side
if (typeof window !== "undefined") {
  getAnalytics(app);
}

export default app;
