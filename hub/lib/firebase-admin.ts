import { getApps, getApp, initializeApp, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getMessaging } from "firebase-admin/messaging"

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase Admin environment variables")
}

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export const adminMessaging = getMessaging(adminApp)
