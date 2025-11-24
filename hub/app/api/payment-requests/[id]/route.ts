import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

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
  { params }: { params: { id: string } }
) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  const { id } = params
  const { action, reason } = await request.json()

  try {
    const paymentRequestRef = adminDb.collection("payment_requests").doc(id)
    const paymentRequestDoc = await paymentRequestRef.get()

    if (!paymentRequestDoc.exists) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    const requestData = paymentRequestDoc.data()
    
    if (!requestData) {
      return NextResponse.json({ error: "Datos de solicitud no encontrados" }, { status: 404 })
    }

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
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
