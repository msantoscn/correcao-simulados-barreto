import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcufXY193-5iym-iBa9whn3gD225BbVcA",
  authDomain: "gestao-simulados.firebaseapp.com",
  projectId: "gestao-simulados",
  storageBucket: "gestao-simulados.firebasestorage.app",
  messagingSenderId: "328626341423",
  appId: "1:328626341423:web:233c7ed30d4be8eac8a8da",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
