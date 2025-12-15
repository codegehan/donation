// firebase/firebaseConfig.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("../api-core-c06dd-firebase-adminsdk-fbsvc-5580d5a08b.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://api-core-c06dd-default-rtdb.firebaseio.com" // 🔁 use your Firebase project URL
});

// Firestore reference
const db = admin.firestore();

export { db, admin };