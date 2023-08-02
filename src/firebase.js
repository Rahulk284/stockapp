import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyC_VmmDMR_Hjhm6hRgXZrunimnAhw9g_vw",
    authDomain: "practice-stock-app.firebaseapp.com",
    projectId: "practice-stock-app",
    storageBucket: "practice-stock-app.appspot.com",
    messagingSenderId: "859451871805",
    appId: "1:859451871805:web:2e76afe2a296a158715054",
    measurementId: "G-QFQJ48ENJW"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

const db = firebaseApp.firestore();
const auth = firebase.auth();

export { db, auth };

