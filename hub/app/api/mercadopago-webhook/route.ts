import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-signature")
    const id = request.headers.get("x-request-id")

    // Verificar firma (opcional pero recomendado)
    if (signature && id) {
      const parts = signature.split(",")
      const ts = parts.find(part => part.startsWith("ts="))?.split("=")[1]
      const hash = parts.find(part => part.startsWith("v1="))?.split("=")[1]
      
      if (ts && hash) {
        const manifest = `id:${id};ts:${ts};`
        const secret = process.env.MP_WEBHOOK_SECRET || ""
        const calculatedHash = crypto
          .createHmac("sha256", secret)
          .update(manifest)
          .digest("hex")
        
        if (calculatedHash !== hash) {
          console.error("Invalid webhook signature")
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
      }
    }

    const data = JSON.parse(body)

    // Procesar diferentes tipos de notificaciones
    if (data.type === "payment") {
      const paymentId = data.data.id
      
      // Obtener detalles del pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Error fetching payment details")
      }
      
      const payment = await response.json()
      
      // Buscar el QR payment correspondiente
      const qrPaymentsSnapshot = await adminDb
        .collection("qr_payments")
        .where("preferenceId", "==", payment.preference_id)
        .get()
      
      if (!qrPaymentsSnapshot.empty) {
        const qrPaymentDoc = qrPaymentsSnapshot.docs[0]
        const qrPaymentData = qrPaymentDoc.data()
        
        // Actualizar estado del pago QR
        await qrPaymentDoc.ref.update({
          status: payment.status,
          paymentId: payment.id,
          paymentDetails: payment,
          approvedAt: payment.status === "approved" ? new Date() : null,
          updatedAt: new Date()
        })
        
        // Si el pago está aprobado, crear solicitud de pago automática
        if (payment.status === "approved") {
          await adminDb.collection("payment_requests").add({
            clientId: qrPaymentData.clientId,
            userId: qrPaymentData.userId,
            userName: qrPaymentData.payer?.name || "Usuario",
            userEmail: qrPaymentData.payer?.email || "",
            amount: qrPaymentData.amount,
            planName: qrPaymentData.planName || "Plan",
            period: qrPaymentData.description.includes("Impresiones") ? 
              "Impresiones " + new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 
              new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
            dueDate: new Date().toLocaleDateString('es-AR'),
            requestDate: new Date().toISOString(),
            status: "approved",
            paymentType: qrPaymentData.paymentType,
            description: qrPaymentData.description,
            printRecords: qrPaymentData.printRecords || [],
            printAmount: qrPaymentData.paymentType !== 'membership' ? qrPaymentData.amount : 0,
            membershipAmount: qrPaymentData.paymentType !== 'printing' ? qrPaymentData.amount : 0,
            approvedAt: new Date(),
            approvedBy: "system",
            paymentMethod: "mercadopago_qr",
            mercadoPagoPaymentId: payment.id
          })
          
          console.log(`Payment approved and request created for user ${qrPaymentData.userId}`)
        }
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ status: "webhook endpoint active" })
}
