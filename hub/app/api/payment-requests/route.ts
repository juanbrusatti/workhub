import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendPaymentRequestEmail } from "@/lib/email"

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
  receiptImage?: string // Base64 image
  createdAt?: any
  paymentType?: 'membership' | 'printing' | 'both' // Tipo de pago
  description?: string // Descripción detallada del pago
  printRecords?: string[] // IDs de registros de impresiones
  printAmount?: number // Monto de las impresiones
  membershipAmount?: number // Monto de la mensualidad
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

    // Enviar notificación por email
    try {
      // Calcular cantidad de hojas reales si hay registros de impresión
      let printSheets = 0
      if (paymentRequest.printRecords && paymentRequest.printRecords.length > 0) {
        try {
          // Obtener los detalles de las impresiones desde Supabase
          const { getSupabaseAdminClient } = await import('@/lib/supabase')
          const supabase = getSupabaseAdminClient()
          
          const { data: printRecordsData, error } = await supabase
            .from('printing_records')
            .select('sheets')
            .in('id', paymentRequest.printRecords)
          
          if (!error && printRecordsData) {
            printSheets = printRecordsData.reduce((total: number, record: any) => total + record.sheets, 0)
            console.log(`Hojas calculadas: ${printSheets} de ${paymentRequest.printRecords.length} registros`)
          } else {
            console.error('Error obteniendo detalles de impresiones:', error)
            // Fallback: usar la cantidad de registros
            printSheets = paymentRequest.printRecords.length
          }
        } catch (supabaseError) {
          console.error('Error conectando a Supabase:', supabaseError)
          // Fallback: usar la cantidad de registros
          printSheets = paymentRequest.printRecords.length
        }
      }

      await sendPaymentRequestEmail({
        userName: paymentRequest.userName,
        userEmail: paymentRequest.userEmail,
        amount: paymentRequest.amount,
        planName: paymentRequest.planName,
        period: paymentRequest.period,
        requestDate: paymentRequest.requestDate,
        receiptImage: paymentRequest.receiptImage,
        paymentType: paymentRequest.paymentType,
        description: paymentRequest.description,
        printAmount: paymentRequest.printAmount,
        printRecords: paymentRequest.printRecords,
        printSheets: printSheets
      })
    } catch (emailError) {
      console.error("Error enviando email de notificación:", emailError)
      // No fallamos la solicitud si el email no se puede enviar
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
