import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { MercadoPagoConfig, Preference } from 'mercadopago'

interface QRRequest {
  amount: number
  description: string
  clientId: string
  paymentType: 'membership' | 'printing' | 'both'
  planName?: string
  printRecords?: string[]
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

    const qrRequest: QRRequest = await request.json()

    // Configurar MercadoPago
    const accessToken = process.env.MP_ACCESS_TOKEN
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN no configurado")
    }

    console.log("App URL:", appUrl) // Debug

    const client = new MercadoPagoConfig({ 
      accessToken,
      options: { timeout: 5000 }
    })

    // Crear preferencia simple para obtener ID
    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: [
          {
            id: `payment_${uid}_${Date.now()}`,
            title: qrRequest.description,
            quantity: 1,
            currency_id: "ARS",
            unit_price: qrRequest.amount,
          }
        ],
        payer: {
          email: decodedToken.email || "",
        },
        external_reference: `${uid}_${qrRequest.clientId}_${Date.now()}`,
      }
    })

    console.log("Preference Result:", result) // Debug

    // Generar QR con datos de la preferencia
    const qrData = {
      preference_id: result.id,
      amount: qrRequest.amount,
      description: qrRequest.description,
      external_reference: `${uid}_${qrRequest.clientId}_${Date.now()}`,
      merchant: "WorkHub",
      timestamp: new Date().toISOString()
    }
    
    // Generar QR con API externa (tamaño reducido)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrData))}`

    // Guardar información del QR en Firestore para seguimiento
    const qrDataFirestore = {
      ...qrRequest,
      userId: uid,
      preferenceId: result.id,
      createdAt: new Date(),
      status: 'pending',
      amount: qrRequest.amount,
      description: qrRequest.description,
      paymentType: qrRequest.paymentType,
      planName: qrRequest.planName,
      printRecords: qrRequest.printRecords || [],
    }

    // Guardar en Firestore
    const { adminDb } = await import("@/lib/firebase-admin")
    await adminDb.collection("qr_payments").add(qrDataFirestore)

    return NextResponse.json({
      success: true,
      qrData: {
        preferenceId: result.id,
        qrCode: qrCodeUrl,
        amount: qrRequest.amount,
        description: qrRequest.description,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        qrData: qrData
      }
    })

  } catch (error) {
    console.error("Error creating QR payment:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error interno del servidor" 
    }, { status: 500 })
  }
}
