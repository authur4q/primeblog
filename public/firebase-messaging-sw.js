// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

import { initializeApp } from "firebase/app";


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


const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {
  const notificationTitle = 'Incoming Call';
  const notificationOptions = {
    body: payload.data.callerName + ' is calling...',
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});