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

    // Enviar notificación a tokens FCM de admins (usar Firebase Cloud Messaging)
    try {
      const tokensSnapshot = await adminDb.collection("fcm_tokens").where("role", "==", "admin").get()
      const tokens = tokensSnapshot.docs.map(d => d.data().token).filter(Boolean) as string[]

      if (tokens.length > 0) {
        const paymentRequestData = (await paymentRequestRef.get()).data() || {}
        const userName = paymentRequestData.userName ?? ''
        const userEmail = paymentRequestData.userEmail ?? ''
        const amountValue = paymentRequestData.amount ?? ''
        const planName = paymentRequestData.planName ?? ''
        const message = {
          notification: {
            title: 'Nueva solicitud de pago',
            body: `${userName} (${userEmail}) solicitó pago de $${amountValue} para ${planName}`,
          },
          data: {
            url: '/admin/payment-requests',
            requestId: paymentRequestRef.id,
            userName: String(userName),
            amount: String(amountValue),
          },
        }

        // Enviar a varios tokens
        const { adminMessaging } = await import('@/lib/firebase-admin')
        const batchSize = 500
        for (let i = 0; i < tokens.length; i += batchSize) {
          const chunk = tokens.slice(i, i + batchSize)
          const adminSdk = await import('firebase-admin')
          const response = await (adminSdk.messaging() as any).sendMulticast({
            tokens: chunk,
            notification: message.notification,
            data: message.data,
          } as any)

          // Manejar tokens inválidos
          response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
              const error = resp.error as any
              if (error && (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-registration-token')) {
                const badToken = chunk[idx]
                adminDb.collection('fcm_tokens').where('token', '==', badToken).get().then(snap => {
                  snap.forEach(doc => doc.ref.delete().catch(() => {}))
                }).catch(() => {})
              }
            }
          })
        }
      }
    } catch (err) {
      console.error('FCM push error:', err)
    }

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

    // Obtener todas las solicitudes de pago pendientes
    const snapshot = await adminDb
      .collection("payment_requests")
      .where("status", "==", "pending")
      .get()

    const requests = snapshot.docs.map(doc => {
      const data = doc.data() as PaymentRequestData
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

    return NextResponse.json({ requests }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

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
