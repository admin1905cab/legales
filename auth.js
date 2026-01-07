// auth.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔒 Protege la página
export function protegerPagina() {
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "login.html";
    }
  });
}

// 🚪 Logout
export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}
