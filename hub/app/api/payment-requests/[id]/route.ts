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

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const forbiddenResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 })

async function ensureAdmin(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { response: unauthorizedResponse }
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Verificar el rol usando los claims del token
    if (decodedToken.role !== "admin") {
      return { response: forbiddenResponse }
    }
  } catch (error) {
    console.error("Failed to verify admin token", error)
    return { response: unauthorizedResponse }
  }

  return { response: null }
}

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  console.log('PATCH request received for ID:', resolvedParams.id)
  
  const { response } = await ensureAdmin(request)
  if (response) return response

  const { id } = resolvedParams
  const { action, reason } = await request.json()

  console.log('Processing action:', action, 'for request:', id)

  try {
    const paymentRequestRef = adminDb.collection("payment_requests").doc(id)
    const paymentRequestDoc = await paymentRequestRef.get()

    console.log('Payment request doc exists:', paymentRequestDoc.exists)

    if (!paymentRequestDoc.exists) {
      console.log('Payment request not found:', id)
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    const requestData = paymentRequestDoc.data() as PaymentRequestData
    
    if (!requestData) {
      console.log('Payment request data is null/undefined')
      return NextResponse.json({ error: "Datos de solicitud no encontrados" }, { status: 404 })
    }

    console.log('Request data:', requestData)

    if (action === "approve") {
      // Actualizar el estado de la solicitud
      await paymentRequestRef.update({
        status: "approved",
        processedAt: new Date(),
        processedBy: "admin"
      })

      // Agregar al historial de pagos del cliente
      await adminDb.collection("payment_history").add({
        clientId: requestData.clientId,
        userId: requestData.userId,
        amount: requestData.amount,
        planName: requestData.planName,
        period: requestData.period,
        status: "pagado",
        transactionId: `TXN-${Date.now()}`,
        paymentDate: new Date(),
        approvedAt: new Date(),
        requestId: id
      })

      // Actualizar el próximo período de pago del cliente
      const clientRef = adminDb.collection("clients").doc(requestData.clientId)
      const clientDoc = await clientRef.get()
      
      if (clientDoc.exists) {
        const clientData = clientDoc.data()
        if (!clientData) {
          console.log('Client data is null/undefined')
          return NextResponse.json({ error: "Datos del cliente no encontrados" }, { status: 404 })
        }
        
        const currentPeriod = clientData.currentPeriod || 1
        
        // Calcular el siguiente período
        const nextPeriod = currentPeriod + 1
        const nextMonthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        
        // Obtener el mes actual basado en el currentPeriod del cliente
        // Si currentPeriod es 1, es el primer mes del cliente; si es 2, el segundo, etc.
        const currentDate = new Date()
        let clientStartMonth = currentDate.getMonth() // Mes actual como referencia
        let clientStartYear = currentDate.getFullYear()
        
        // Calcular el mes de inicio del cliente restando (currentPeriod - 1) meses
        clientStartMonth = (clientStartMonth - (currentPeriod - 1) + 12) % 12
        clientStartYear = clientStartYear - Math.floor((currentDate.getMonth() - (currentPeriod - 1)) / 12)
        
        // El siguiente período es el mes siguiente al período actual del cliente
        const nextMonth = (clientStartMonth + currentPeriod) % 12
        const nextYear = clientStartYear + Math.floor((clientStartMonth + currentPeriod) / 12)
        
        console.log('Calculation details:', {
          currentPeriod,
          clientStartMonth,
          clientStartYear,
          nextMonth,
          nextYear
        })
        
        await clientRef.update({
          currentPeriod: nextPeriod,
          lastPaymentDate: new Date(),
          nextPaymentPeriod: `${nextMonthNames[nextMonth]} ${nextYear}`,
          paymentStatus: 'active'
        })
        
        console.log('Updated client next payment period to:', `${nextMonthNames[nextMonth]} ${nextYear}`)
        console.log('Client data after update:', {
          currentPeriod: nextPeriod,
          nextPaymentPeriod: `${nextMonthNames[nextMonth]} ${nextYear}`,
          paymentStatus: 'active'
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Pago aprobado correctamente" 
      })

    } else if (action === "reject") {
      await paymentRequestRef.update({
        status: "rejected",
        processedAt: new Date(),
        processedBy: "admin",
        rejectionReason: reason || "Solicitud rechazada"
      })

      return NextResponse.json({ 
        success: true, 
        message: "Solicitud rechazada" 
      })

    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error processing payment request:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error interno del servidor" 
    }, { status: 500 })
  }
}
