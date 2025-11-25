import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    const body = await request.json()
    const subscription = body.subscription

    console.log('Incoming register-subscription request for uid:', uid)
    console.log('Subscription payload keys:', Object.keys(subscription || {}))

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 })
    }

    // Guardar la suscripción en Firestore junto al rol del usuario
    await adminDb.collection("push_subscriptions").doc(uid).set({
      subscription,
      role: decodedToken.role || 'client',
      updatedAt: new Date(),
    })

    console.log('Saved subscription for uid:', uid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error registering subscription:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
