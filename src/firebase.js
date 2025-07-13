import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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
const functions = getFunctions(app);

// Uncomment the following lines to connect to the Firebase Functions emulator during development
if (process.env.NODE_ENV === 'development') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export { functions };