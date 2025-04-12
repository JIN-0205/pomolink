// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZOKrRAnIFq-znlRXsZ2hC3K7p6J12K5A",
  authDomain: "pomolink-52e35.firebaseapp.com",
  projectId: "pomolink-52e35",
  storageBucket: "pomolink-52e35.firebasestorage.app",
  messagingSenderId: "835699803425",
  appId: "1:835699803425:web:8ffe7b4a218070ce456a60",
  measurementId: "G-NB5VMV8RKH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

export default storage;
