import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBfwIDGolxtV2CrV3x_FnIcb8t-mHGxrS4",
    authDomain: "bento-and-friends.firebaseapp.com",
    projectId: "bento-and-friends",
    storageBucket: "bento-and-friends.appspot.com",
    messagingSenderId: "268928680108",
    appId: "1:268928680108:web:cfd96df60a16b06ca59f09",
    measurementId: "G-H7VXMSXRQS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);