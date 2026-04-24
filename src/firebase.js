// Import funcțiile necesare din Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// 1. Adaug importul pentru baza de date Firestore
import { getFirestore } from "firebase/firestore";

// Aici îmi pun configurația unică generată de Firebase pentru proiectul meu
const firebaseConfig = {
  apiKey: "AIzaSyCEYlzt5NWhM0jgOaNOOlgoZ04LgPIYonc",
  authDomain: "licenta-findash.firebaseapp.com",
  projectId: "licenta-findash",
  storageBucket: "licenta-findash.firebasestorage.app",
  messagingSenderId: "825619783735",
  appId: "1:825619783735:web:1904032b3732b8e1d09fb2"
};

// Inițializez aplicația mea Firebase
const app = initializeApp(firebaseConfig);

// Extrag serviciul de Autentificare și setez Google ca metodă de logare
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 2. Inițializez și export baza mea de date în cloud ca să o pot folosi în aplicație
export const db = getFirestore(app);

// Export funcțiile pe care le voi folosi
export { signInWithPopup, signOut };