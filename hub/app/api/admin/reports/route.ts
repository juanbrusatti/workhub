import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

interface Report {
  id: string
  clientId: string
  userId: string
  userName: string
  userEmail: string
  type: 'yerba' | 'broken' | 'other'
  priority: 'low' | 'medium' | 'high'
  message: string
  image?: string
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: any
  updatedAt: any
}

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Verificar que es admin
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Obtener todos los reportes ordenados por fecha (más recientes primero)
    const snapshot = await adminDb
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get()

    const reports = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as Report
    })

    return NextResponse.json({ reports }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Error interno del servidor"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Verificar que es admin
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { reportId, status } = await request.json()

    if (!reportId || !status) {
      return NextResponse.json(
        { error: "reportId y status son requeridos" },
        { status: 400 }
      )
    }

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      )
    }

    // Actualizar el estado del reporte
    await adminDb.collection("reports").doc(reportId).update({
      status: status,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: "Reporte actualizado correctamente"
    })

  } catch (error) {
    console.error("Error updating report:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Error interno del servidor"
    }, { status: 500 })
  }
}
