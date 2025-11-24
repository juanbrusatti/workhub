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

    // Obtener el historial de pagos del usuario (sin ordenar para evitar índice)
    console.log('Fetching payment history for user:', uid)
    const snapshot = await adminDb
      .collection("payment_history")
      .where("userId", "==", uid)
      .get()

    console.log('Payment history fetched, docs count:', snapshot.docs.length)

    const payments = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Payment doc data:', data)
      return {
        id: doc.id,
        period: data.period,
        amount: data.amount,
        status: data.status,
        paymentDate: data.paymentDate,
        transactionId: data.transactionId,
        planName: data.planName
      }
    })

    // Ordenar en memoria por paymentDate
    payments.sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime()
      const dateB = new Date(b.paymentDate).getTime()
      return dateB - dateA // Descendente
    })

    console.log('Final payments array:', payments)

    return NextResponse.json({ payments })

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
