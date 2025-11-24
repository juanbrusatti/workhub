// app/api/admin/clients/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const unauthorizedResponse = { error: 'No autorizado' }
const forbiddenResponse = { error: 'Acceso denegado' }

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extraer el ID del cliente de los parámetros
    const { id: clientId } = await params
    
    if (!clientId) {
      return NextResponse.json({ error: 'ID de cliente no proporcionado' }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(unauthorizedResponse, { status: 401 })
    }

    const idToken = authHeader.split(' ')[1]
    
    // Verificar token y rol de admin
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(forbiddenResponse, { status: 403 })
    }

    const { status } = await request.json()
    
    // Validar estado
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' }, 
        { status: 400 }
      )
    }

    // Actualizar estado en Firestore
    await adminDb.collection('clients').doc(clientId).update({
      status,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error actualizando estado del cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el estado' },
      { status: 500 }
    )
  }
}