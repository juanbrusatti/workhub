import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idToken = authHeader.split(" ")[1]

  try {
    console.log('[FCM-API] Verifying ID token...')
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    console.log('[FCM-API] Token verified for UID:', uid, 'Role:', decodedToken.role)

    const body = await request.json()
    const token = body.token
    console.log('[FCM-API] Received FCM token:', token ? `${token.substring(0, 50)}...` : 'null')

    if (!token) {
      console.error('[FCM-API] Missing token in request body')
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    console.log('[FCM-API] Saving token to Firestore for UID:', uid)
    await adminDb.collection("fcm_tokens").doc(uid).set({
      token,
      role: decodedToken.role || 'client',
      updatedAt: new Date(),
    })
    console.log('[FCM-API] Token saved successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FCM-API] Error registering fcm token:', error)
    return NextResponse.json({ error: "Error interno del servidor", details: String(error) }, { status: 500 })
  }
}
