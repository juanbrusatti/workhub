import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { sendReportEmail } from "@/lib/email"

interface ReportData {
  clientId: string
  userId: string
  userName: string
  userEmail: string
  type: 'yerba' | 'broken' | 'other'
  priority: 'low' | 'medium' | 'high'
  message: string
  image?: string
  status?: 'pending' | 'in_progress' | 'resolved'
  createdAt?: any
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

    const reportData = await request.json()

    // Guardar el reporte en Firestore
    const reportRef = await adminDb.collection("reports").add({
      ...reportData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Enviar notificación por email al admin
    try {
      await sendReportEmail({
        clientName: reportData.userName,
        clientEmail: reportData.userEmail,
        type: reportData.type,
        priority: reportData.priority,
        message: reportData.message,
        image: reportData.image || null,
        reportId: reportRef.id,
        createdAt: new Date()
      })
    } catch (emailError) {
      console.error("Error enviando email de reporte:", emailError)
      // No fallamos si el email no se envía
    }

    return NextResponse.json({
      success: true,
      reportId: reportRef.id,
      message: "Reporte enviado correctamente"
    })

  } catch (error) {
    console.error("Error creating report:", error)
    return NextResponse.json({
      error: "Error interno del servidor"
    }, { status: 500 })
  }
}
