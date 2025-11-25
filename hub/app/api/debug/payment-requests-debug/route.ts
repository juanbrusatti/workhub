import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// ⚠️ ENDPOINT TEMPORAL PARA DEBUG - SIN AUTENTICACIÓN
// ⚠️ ELIMINAR DESPUÉS DE DEBUGGEAR

export async function GET(request: Request) {
  try {
    console.log('DEBUG: Fetching all payment requests...')
    
    // Obtener todas las solicitudes de pago
    const snapshot = await adminDb
      .collection("payment_requests")
      .get()

    console.log('DEBUG: Total requests found:', snapshot.docs.length)
    
    const requests = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        period: data.period,
        userId: data.userId,
        clientId: data.clientId,
        status: data.status,
        userName: data.userName,
        userEmail: data.userEmail,
        requestDate: data.requestDate,
        processedAt: data.processedAt,
        processedBy: data.processedBy
      }
    })

    // Agrupar por estado
    const grouped = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      others: requests.filter(r => !['pending', 'approved', 'rejected'].includes(r.status)).length
    }

    // Agrupar por período y usuario
    const byPeriodAndUser = requests.reduce((acc, req) => {
      const key = `${req.period}-${req.userId}-${req.clientId}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(req)
      return acc
    }, {} as Record<string, any[]>)

    // Encontrar duplicados
    const duplicates = Object.entries(byPeriodAndUser)
      .filter(([key, reqs]) => reqs.length > 1)
      .map(([key, reqs]) => ({ key, requests: reqs }))

    return NextResponse.json({ 
      summary: grouped,
      duplicates: duplicates,
      allRequests: requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
    })

  } catch (error) {
    console.error('DEBUG: Error fetching payment requests:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
