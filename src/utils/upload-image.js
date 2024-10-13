// src/utils/upload-image.js

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { readFile } from 'fs/promises';
import path from 'path';

// Your web app's Firebase configuration
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

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

async function uploadImage() {
  try {
    // Path to your image file
    const imagePath = path.resolve('src/assets/banner.png');
    
    // Read file
    const logoFile = await readFile(imagePath);

    // Create a reference to the location where you want to store the logo
    const logoRef = ref(storage, 'images/banner.png');

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(logoRef, logoFile);
    console.log('Uploaded logo file');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Logo available at', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

uploadImage();