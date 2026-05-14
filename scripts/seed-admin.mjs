import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "serviceAccountKey.json";
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME || "Administrador";
const domain = process.env.ADMIN_DOMAIN || "icfes.local";

if (!password) {
  console.error("Define ADMIN_PASSWORD antes de correr este script.");
  console.error("Ejemplo PowerShell: $env:ADMIN_PASSWORD='tu-clave'; npm run firebase:seed-admin");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const email = `${username.toLowerCase()}@${domain}`;

let userRecord;
try {
  userRecord = await auth.getUserByEmail(email);
  await auth.updateUser(userRecord.uid, { password, displayName: fullName });
} catch (error) {
  if (error.code !== "auth/user-not-found") {
    throw error;
  }
  userRecord = await auth.createUser({
    email,
    password,
    displayName: fullName
  });
}

await db.collection("users").doc(userRecord.uid).set({
  id: userRecord.uid,
  username,
  usernameKey: username.toLowerCase(),
  fullName,
  role: "admin",
  status: "active",
  createdAt: FieldValue.serverTimestamp(),
  approvedAt: FieldValue.serverTimestamp()
}, { merge: true });

console.log(`Admin listo: ${username}`);
