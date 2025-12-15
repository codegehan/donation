// src/firebase/firebase.js
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

// ✅ Priority 1: Render / Production
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}
// ✅ Priority 2: Local development
else {
  const localKeyPath = path.resolve(
    __dirname,
    "../secrets/api-core-c06dd-6682e9ac51d7.json"
  );

  if (!existsSync(localKeyPath)) {
    throw new Error("Firebase service account key not found");
  }

  serviceAccount = JSON.parse(
    readFileSync(localKeyPath, "utf8")
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
export { admin, db };
