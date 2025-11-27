import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET(request: Request) {
  try {
    console.log('🔍 GET /api/client/announcements - Iniciando...')
    
    // Obtener token del header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No autorizado: Header inválido')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token)
      console.log('✅ Token verificado, email:', decodedToken.email)
    } catch (tokenError) {
      console.error('❌ Error verificando token:', tokenError)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    
    console.log(`📄 Paginación: página ${page}, límite ${limit}`)

    // Obtener todos los anuncios activos
    const announcementsSnapshot = await adminDb
      .collection('announcements')
      .get()

    console.log('🔍 Anuncios totales encontrados:', announcementsSnapshot.docs.length)

    // Procesar y ordenar anuncios
    const allAnnouncements = announcementsSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        }
      })
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log('✅ Anuncios procesados:', allAnnouncements.length)

    // Calcular paginación
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex)

    console.log(`📊 Paginación: mostrando ${paginatedAnnouncements.length} de ${allAnnouncements.length} (página ${page})`)

    return NextResponse.json({
      announcements: paginatedAnnouncements,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allAnnouncements.length / limit),
        totalAnnouncements: allAnnouncements.length,
        hasNextPage: endIndex < allAnnouncements.length,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('❌ Error general en GET /api/client/announcements:', error)
    return NextResponse.json({ 
      error: 'Error del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
