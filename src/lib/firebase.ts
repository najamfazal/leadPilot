// @ts-nocheck
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
