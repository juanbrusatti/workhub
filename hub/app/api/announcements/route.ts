import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { sendAnnouncementEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    // Verificar autenticación del admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    console.log('✅ Token verificado en POST, email:', decodedToken.email)
    
    // Temporalmente permitir cualquier usuario autenticado para depurar
    // if (!decodedToken.email?.includes('admin')) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    // }

    const { title, content, type, priority } = await request.json()

    // Validar datos
    if (!title || !content || !type || !priority) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Validar tipos
    const validTypes = ['info', 'maintenance', 'event']
    const validPriorities = ['low', 'medium', 'high']

    if (!validTypes.includes(type) || !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Tipo o prioridad inválidos' }, { status: 400 })
    }

    // Crear anuncio en Firestore
    const announcementData = {
      title,
      content,
      type,
      priority,
      createdAt: new Date(),
      createdBy: decodedToken.uid,
      active: true
    }

    const announcementRef = await adminDb.collection('announcements').add(announcementData)
    const announcementId = announcementRef.id

    // Obtener todos los clientes para enviar emails
    console.log('🔍 Obteniendo clientes para enviar emails...')
    
    // Primero obtener todos los clientes para depurar
    const allClientsSnapshot = await adminDb.collection('clients').get()
    const allClients = allClientsSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      companyName: doc.data().companyName,
      active: doc.data().active,
      status: doc.data().status,
      ...doc.data()
    }))

    console.log('🔍 TODOS los clientes encontrados:', allClients.length)
    console.log('📊 Datos de todos los clientes:', allClients.map(c => ({
      email: c.email,
      active: c.active,
      status: c.status
    })))

    // Ahora filtrar por status === 'active'
    const activeClients = allClients.filter(client => client.status === 'active')
    
    console.log('🔍 Clientes activos filtrados:', activeClients.length)
    console.log('📊 Emails de clientes activos:', activeClients.map(c => c.email))

    const clients = activeClients

    if (clients.length === 0) {
      console.log('⚠️ No hay clientes activos para enviar emails')
      return NextResponse.json({
        success: true,
        announcementId,
        announcement: {
          id: announcementId,
          ...announcementData
        },
        emailStats: {
          total: 0,
          successful: 0,
          failed: 0,
          message: 'No hay clientes activos'
        }
      })
    }

    // Enviar emails a todos los clientes
    console.log('📧 Iniciando envío de emails a', clients.length, 'clientes...')
    const emailPromises = clients.map(async (client, index) => {
      try {
        console.log(`📧 Enviando email ${index + 1}/${clients.length} a ${client.email}...`)
        
        const emailData = {
          clientEmail: client.email,
          clientName: client.name,
          companyName: client.companyName,
          title,
          content,
          type,
          priority,
          createdAt: new Date()
        }
        
        console.log('📧 Email data:', emailData)
        
        const result = await sendAnnouncementEmail(emailData)
        
        console.log(`✅ Email enviado exitosamente a ${client.email}:`, result)
        return { success: true, clientId: client.id, email: client.email, result }
      } catch (error) {
        console.error(`❌ Error enviando email a ${client.email}:`, error)
        return { success: false, clientId: client.id, email: client.email, error }
      }
    })

    const emailResults = await Promise.allSettled(emailPromises)
    
    console.log('📊 Resultados de emails:', emailResults)
    
    const successfulEmails = emailResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length
    const failedEmails = emailResults.length - successfulEmails

    console.log(`📈 Estadísticas finales:`)
    console.log(`📧 Anuncio creado: ${title}`)
    console.log(`✅ Emails exitosos: ${successfulEmails}`)
    console.log(`❌ Emails fallidos: ${failedEmails}`)
    console.log(`📊 Total emails: ${emailResults.length}`)

    // Mostrar detalles de los fallidos
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
        console.error(`❌ Email ${index + 1} falló:`, result)
      }
    })

    return NextResponse.json({
      success: true,
      announcementId,
      announcement: {
        id: announcementId,
        ...announcementData
      },
      emailStats: {
        total: emailResults.length,
        successful: successfulEmails,
        failed: failedEmails
      }
    })

  } catch (error) {
    console.error('Error creando anuncio:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    console.log('🔍 GET /api/announcements - Iniciando...')
    
    // Verificar autenticación del admin
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 AuthHeader:', authHeader ? 'Presente' : 'Ausente')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No autorizado: Header inválido')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('🔍 Token length:', token.length)
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token)
      console.log('✅ Token verificado, email:', decodedToken.email)
      console.log('🔍 Email contains admin?', decodedToken.email?.includes('admin'))
      console.log('🔍 User email:', decodedToken.email)
      
      // Temporalmente permitir cualquier usuario autenticado para depurar
      // if (!decodedToken.email?.includes('admin')) {
      //   console.log('❌ No autorizado: No es admin')
      //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      // }
      
      console.log('✅ Usuario autorizado temporalmente')
    } catch (tokenError) {
      console.error('❌ Error verificando token:', tokenError)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    console.log('🔍 Obteniendo anuncios de Firestore...')
    
    // Obtener todos los anuncios (los eliminados permanentemente no existirán)
    const announcementsSnapshot = await adminDb
      .collection('announcements')
      .get()

    console.log('🔍 Anuncios encontrados:', announcementsSnapshot.docs.length)

    const announcements = announcementsSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        }
      })
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log('✅ Anuncios procesados:', announcements.length)

    return NextResponse.json({ announcements })

  } catch (error) {
    console.error('❌ Error general en GET /api/announcements:', error)
    return NextResponse.json({ 
      error: 'Error del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Verificar autenticación del admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    console.log('✅ Token verificado en DELETE, email:', decodedToken.email)
    
    // Temporalmente permitir cualquier usuario autenticado para depurar
    // if (!decodedToken.email?.includes('admin')) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    // }

    const { announcementId } = await request.json()

    if (!announcementId) {
      return NextResponse.json({ error: 'ID del anuncio requerido' }, { status: 400 })
    }

    // Eliminar permanentemente el anuncio de Firebase
    console.log(`🗑️ Eliminando permanentemente el anuncio ${announcementId}...`)
    
    await adminDb.collection('announcements').doc(announcementId).delete()

    console.log(`✅ Anuncio ${announcementId} eliminado permanentemente por admin ${decodedToken.uid}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error eliminando anuncio:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
