import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Obtener datos del request
    const { period, userId, clientId } = await request.json()
    
    if (!period || !userId || !clientId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('Checking existing payment request:', { period, userId, clientId })

    // Verificar si ya existe una solicitud para este período y usuario (cualquier estado)
    const snapshot = await adminDb
      .collection("payment_requests")
      .where("period", "==", period)
      .where("userId", "==", userId)
      .where("clientId", "==", clientId)
      .limit(1)
      .get()

    const exists = !snapshot.empty

    console.log('Query results:', {
      period,
      userId,
      clientId,
      status: "any",
      docsFound: snapshot.docs.length,
      exists
    })

    // Log details of found document (if any)
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      console.log('Found existing request:', {
        id: doc.id,
        data: doc.data()
      })
    }

    return NextResponse.json({ exists })

  } catch (error) {
    console.error("Error checking existing payment request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
