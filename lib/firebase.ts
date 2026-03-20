// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvR99mNOcF0TzybC27qLiXk2pTL3hIF4I",
  authDomain: "smart-finance-navigator.firebaseapp.com",
  projectId: "smart-finance-navigator",
  storageBucket: "smart-finance-navigator.firebasestorage.app",
  messagingSenderId: "463037530241",
  appId: "1:463037530241:web:2cc2ea99d7ec0589638d80",
  measurementId: "G-6H5SQT7NP6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app)