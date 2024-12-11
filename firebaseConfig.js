// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Importa Firestore
import { getAnalytics } from "firebase/analytics";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD1LLq2PBTyA31kFCFQ9V76ibNsAt4ttw4",
  authDomain: "seguimiento-ocular-nextjsespe.firebaseapp.com",
  projectId: "seguimiento-ocular-nextjsespe",
  storageBucket: "seguimiento-ocular-nextjsespe.firebasestorage.app",
  messagingSenderId: "741395500974",
  appId: "1:741395500974:web:116bb37d1483cb8c04023f",
  measurementId: "G-SWM9K659QC",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app); // Configura Firestore

// Inicializa Analytics (opcional)
const analytics = getAnalytics(app);

// Exporta la instancia de Firestore
export { db };
