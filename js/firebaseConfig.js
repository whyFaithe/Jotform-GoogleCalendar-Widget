// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
          apiKey: "AIzaSyC7DOSxXvIaj7CbmVDcF6_EnvKeFWKXcqE",
          authDomain: "jotform-calendar-widget-beb41.firebaseapp.com",
          projectId: "jotform-calendar-widget-beb41",
          storageBucket: "jotform-calendar-widget-beb41.firebasestorage.app",
          messagingSenderId: "415403567282",
          appId: "1:415403567282:web:e2b6250dbe795c63eb81ab"
        };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, doc, getDoc, setDoc };
