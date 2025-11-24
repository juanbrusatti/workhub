import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function GET(request: Request) {
  console.log('GET /api/payment-history - Starting request')
  
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    console.log('No authorization header or invalid format')
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]
  console.log('Token extracted, verifying...')

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    console.log('Token verified for user:', uid)

    // Obtener el historial de pagos del usuario
    const snapshot = await adminDb
      .collection("payment_history")
      .where("userId", "==", uid)
      .get()

    const payments = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        period: data.period,
        amount: data.amount,
        status: data.status,
        paymentDate: data.paymentDate,
        planName: data.planName
      }
    })

    // Ordenar en memoria por paymentDate
    payments.sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime()
      const dateB = new Date(b.paymentDate).getTime()
      return dateB - dateA // Descendente
    })

    return NextResponse.json({ payments }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("Error fetching payment history:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error interno del servidor" 
    }, { status: 500 })
  }
}
