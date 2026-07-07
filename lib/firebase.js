import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";



  

  const firebaseConfig = {
    apiKey: "AIzaSyBe4veysRFA2mCRU2IN63-XBtnwzsgUFoE",
    authDomain: "prime-95754.firebaseapp.com",
    projectId: "prime-95754",
    storageBucket: "prime-95754.firebasestorage.app",
    messagingSenderId: "51943955557",
    appId: "1:51943955557:web:f8c3a172a4b8e6cf6f7a8c",
    measurementId: "G-6D0SRPK4R0"
  };
  


const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;