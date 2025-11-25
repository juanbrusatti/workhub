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
    const token = body.token

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    await adminDb.collection("fcm_tokens").doc(uid).set({
      token,
      role: decodedToken.role || 'client',
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error registering fcm token:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
