// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 🔹 Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAFeygq1iMdSE7A9y6MK7PpTH0US6TULlY",
  authDomain: "legales-cab.firebaseapp.com",
  projectId: "legales-cab",
  storageBucket: "legales-cab.appspot.com",
  messagingSenderId: "329260025484",
  appId: "1:329260025484:web:30752d0864cc78db7f1da9"
};

// 🔥 Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
const auth = getAuth(app);

// 🗂 Firestore
const db = getFirestore(app);

// 📦 Storage
const storage = getStorage(app);

// Exportamos servicios
export { auth, db, storage };
