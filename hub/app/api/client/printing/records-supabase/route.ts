import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

async function ensureClient(request: Request) {
  const authHeader = request.headers.get("authorization")
  console.log("Auth header:", authHeader ? "Present" : "Missing")
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Invalid auth header format")
    return { response: unauthorizedResponse }
  }

  const idToken = authHeader.split(" ")[1]
  console.log("Token extracted:", idToken ? "Present" : "Missing")

  try {
    // Usar Firebase para verificar el token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log("Token verified:", { uid: decodedToken.uid, role: decodedToken.role })
    
    if (decodedToken.role !== "client") {
      console.log("Role check failed:", decodedToken.role)
      return { response: NextResponse.json({ error: "Forbidden - Not a client" }, { status: 403 }) }
    }
    
    // Obtener datos del cliente desde Firestore
    const clientDoc = await adminDb.collection("clients").doc(decodedToken.uid).get()
    if (!clientDoc.exists) {
      console.log("Client not found for UID:", decodedToken.uid)
      return { response: NextResponse.json({ error: "Client not found" }, { status: 404 }) }
    }

    const clientData = clientDoc.data()
    const clientName = clientData?.name || decodedToken.name || "Unknown"
    
    return { user: decodedToken, clientName, response: null }
  } catch (error) {
    console.error("Failed to verify client token:", error)
    return { response: unauthorizedResponse }
  }
}

export async function GET(request: Request) {
  const { user, response } = await ensureClient(request)
  if (response) return response

  try {
    const supabase = getSupabaseAdminClient()
    console.log("GET printing_records - User:", user.uid)
    
    const { data: records, error } = await supabase
      .from('printing_records')
      .select('*')
      .eq('client_id', user.uid)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }

    console.log("Registros encontrados:", records?.length || 0)
    console.log("Datos retornados:", records)

    return NextResponse.json({ records: records || [] })
  } catch (error) {
    console.error("Failed to fetch print records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user, clientName, response } = await ensureClient(request)
  if (response) return response

  try {
    const { sheets } = await request.json()
    console.log("POST printing_records - User:", user.uid, "Sheets:", sheets)

    if (!sheets || typeof sheets !== "number" || sheets <= 0) {
      return NextResponse.json({ error: "Invalid number of sheets" }, { status: 400 })
    }

    if (sheets > 100) {
      return NextResponse.json({ error: "Maximum 100 sheets per record" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Obtener configuración de precios
    const { data: settings, error: settingsError } = await supabase
      .from('printing_settings')
      .select('price_per_sheet')
      .eq('id', 'default')
      .single()
    
    console.log("Settings query result:", { settings, settingsError })
    
    const pricePerSheet = settings?.price_per_sheet || 5 // Default $5
    console.log("Using price per sheet:", pricePerSheet)
    
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD

    const recordData = {
      client_id: user.uid,
      client_name: clientName,
      client_email: user.email || '',
      sheets,
      date: dateStr,
      created_at: now.toISOString(),
      price_per_sheet: pricePerSheet,
      status: "pending"
    }

    console.log("Guardando registro:", recordData)
    const { data: result, error: insertError } = await supabase
      .from('printing_records')
      .insert(recordData)
      .select()
      .single()

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      console.error("Error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json({ 
        error: "Failed to create record",
        details: insertError.message,
        code: insertError.code 
      }, { status: 500 })
    }

    console.log("Registro guardado con ID:", result.id)

    return NextResponse.json({
      id: result.id,
      clientName,
      date: dateStr,
      createdAt: result.created_at
    })

  } catch (error) {
    console.error("Failed to create print record:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
