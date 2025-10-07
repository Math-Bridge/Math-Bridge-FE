import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNpAKIsKZn1-NOC8s-Ga_hF57WfmHH__k",
  authDomain: "mathbridge-2874f.firebaseapp.com",
  projectId: "mathbridge-2874f",
  storageBucket: "mathbridge-2874f.firebasestorage.app",
  messagingSenderId: "145206223040",
  appId: "1:145206223040:web:353e9d5a28e827c5910d25",
  measurementId: "G-QX24K11JDM"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const token = await user.getIdToken(); // Token gửi lên backend nếu cần
  return { user, token };
};
