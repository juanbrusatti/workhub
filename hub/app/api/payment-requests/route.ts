import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

interface PaymentRequestData {
  clientId: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  dueDate: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: any
}

interface PaymentRequest extends PaymentRequestData {
  id: string
}

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    const paymentRequest = await request.json()

    // Guardar la solicitud de pago en Firestore
    const paymentRequestRef = await adminDb.collection("payment_requests").add({
      ...paymentRequest,
      createdAt: new Date(),
      id: null // Se asignará automáticamente
    })

    // Actualizar el ID del documento
    await paymentRequestRef.update({ id: paymentRequestRef.id })

    return NextResponse.json({ 
      success: true, 
      requestId: paymentRequestRef.id,
      message: "Solicitud de pago enviada correctamente"
    })

  } catch (error) {
    console.error("Error creating payment request:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Verificar el rol usando los claims del token
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Obtener todas las solicitudes de pago pendientes (sin ordenar para evitar índice)
    console.log('Attempting to fetch payment requests...')
    console.log('Current time:', new Date().toISOString())
    
    const snapshot = await adminDb
      .collection("payment_requests")
      .where("status", "==", "pending")
      .get()

    console.log('Fetched snapshot, docs count:', snapshot.docs.length)
    
    // Log detallado de cada documento
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data()
      console.log(`Document ${index + 1}:`, {
        id: doc.id,
        status: data.status,
        userName: data.userName,
        userEmail: data.userEmail,
        requestDate: data.requestDate,
        processedAt: data.processedAt
      })
    })
    
    const requests = snapshot.docs.map(doc => {
      const data = doc.data() as PaymentRequestData
      console.log('Document data:', data)
      return {
        id: doc.id,
        ...data
      } as PaymentRequest
    })

    // Ordenar en memoria por requestDate
    requests.sort((a, b) => {
      const dateA = new Date(a.requestDate).getTime()
      const dateB = new Date(b.requestDate).getTime()
      return dateB - dateA // Descendente
    })

    console.log('Final requests array:', requests)

    return NextResponse.json({ requests })

  } catch (error) {
    console.error("Error fetching payment requests:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error interno del servidor" 
    }, { status: 500 })
  }
}
