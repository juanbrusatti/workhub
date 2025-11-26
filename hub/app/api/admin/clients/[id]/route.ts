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
    if (decodedToken.role !== "admin") {
      return { response: forbiddenResponse }
    }
  } catch (error) {
    console.error("Failed to verify admin token", error)
    return { response: unauthorizedResponse }
  }

  return { response: null }
}

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  const resolvedParams = await params
  const clientId = resolvedParams.id

  if (!clientId) {
    return NextResponse.json({ error: "ID de cliente requerido" }, { status: 400 })
  }

  try {
    // Primero, obtener los datos del cliente para encontrar el userId
    const clientDoc = await adminDb.collection("clients").doc(clientId).get()
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const clientData = clientDoc.data()
    const userId = clientData?.userId

    if (!userId) {
      return NextResponse.json({ error: "Usuario asociado no encontrado" }, { status: 404 })
    }

    // Eliminar en batch: cliente, usuario y registros relacionados
    const batch = adminDb.batch()

    // 1. Eliminar el documento del cliente
    const clientRef = adminDb.collection("clients").doc(clientId)
    batch.delete(clientRef)

    // 2. Eliminar el usuario de Firebase Auth
    try {
      await adminAuth.deleteUser(userId)
      console.log(`Usuario ${userId} eliminado de Firebase Auth`)
    } catch (authError) {
      console.error("Error eliminando usuario de Firebase Auth:", authError)
      // Continuamos con la eliminación del cliente incluso si falla Auth
    }

    // 3. Eliminar registros relacionados del cliente
    const relatedCollections = [
      "payment_requests",
      "payment_history"
    ]

    for (const collectionName of relatedCollections) {
      const snapshot = await adminDb
        .collection(collectionName)
        .where("clientId", "==", clientId)
        .get()

      snapshot.forEach(doc => {
        batch.delete(doc.ref)
      })
    }

    // 4. Eliminar registros relacionados por userId
    const userRelatedCollections = [
      "sessions",
      "user_activity"
    ]

    for (const collectionName of userRelatedCollections) {
      const snapshot = await adminDb
        .collection(collectionName)
        .where("userId", "==", userId)
        .get()

      snapshot.forEach(doc => {
        batch.delete(doc.ref)
      })
    }

    // Ejecutar todas las eliminaciones en batch
    await batch.commit()

    // 5. Eliminar registros de impresiones de Supabase
    try {
      const { getSupabaseAdminClient } = await import('@/lib/supabase')
      const supabase = getSupabaseAdminClient()
      
      // Eliminar todos los registros de impresiones del cliente
      const { data: deletedRecords, error: printError } = await supabase
        .from('printing_records')
        .delete()
        .eq('client_id', clientId)
        .select()
      
      if (!printError) {
        console.log(`Eliminados ${deletedRecords?.length || 0} registros de impresiones del cliente ${clientId}`)
      } else {
        console.error('Error eliminando registros de impresiones:', printError)
      }
    } catch (supabaseError) {
      console.error('Error conectando a Supabase para eliminar impresiones:', supabaseError)
    }

    console.log(`Cliente ${clientId} y todos sus datos relacionados han sido eliminados`)

    return NextResponse.json({ 
      success: true, 
      message: "Cliente eliminado correctamente" 
    })

  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return NextResponse.json({ 
      error: "Error al eliminar el cliente",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
