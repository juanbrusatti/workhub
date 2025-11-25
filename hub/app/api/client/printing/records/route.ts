import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

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
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log("Token verified:", { uid: decodedToken.uid, role: decodedToken.role })
    
    if (decodedToken.role !== "client") {
      console.log("Role check failed:", decodedToken.role)
      return { response: NextResponse.json({ error: "Forbidden - Not a client" }, { status: 403 }) }
    }
    
    return { decodedToken, response: null }
  } catch (error) {
    console.error("Failed to verify client token:", error)
    return { response: unauthorizedResponse }
  }
}

export async function GET(request: Request) {
  const { decodedToken, response } = await ensureClient(request)
  if (response) return response

  try {
    console.log("GET printing_records - User:", decodedToken.uid)
    
    const snapshot = await adminDb
      .collection("printing_records")
      .where("clientId", "==", decodedToken.uid)
      .orderBy("createdAt", "desc")
      .get()

    console.log("Registros encontrados:", snapshot.docs.length)

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log("Datos retornados:", records)

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Failed to fetch print records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { decodedToken, response } = await ensureClient(request)
  if (response) return response

  try {
    const { sheets } = await request.json()
    console.log("POST printing_records - User:", decodedToken.uid, "Sheets:", sheets)

    if (!sheets || typeof sheets !== "number" || sheets <= 0) {
      return NextResponse.json({ error: "Invalid number of sheets" }, { status: 400 })
    }

    if (sheets > 100) {
      return NextResponse.json({ error: "Maximum 100 sheets per record" }, { status: 400 })
    }

    // Get client data
    const clientDoc = await adminDb.collection("clients").doc(decodedToken.uid).get()
    if (!clientDoc.exists) {
      console.log("Client not found for UID:", decodedToken.uid)
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const clientData = clientDoc.data()
    const clientName = clientData?.name || decodedToken.name || "Unknown"
    console.log("Client data found:", { uid: decodedToken.uid, name: clientName })

    // Get printing settings
    const settingsDoc = await adminDb.collection("printing_settings").doc("default").get()
    const settingsData = settingsDoc.exists ? settingsDoc.data() : { pricePerSheet: 0 }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD

    const recordData = {
      clientId: decodedToken.uid,
      clientName,
      sheets,
      date: dateStr,
      createdAt: now.toISOString(),
      pricePerSheet: settingsData.pricePerSheet || 0,
      totalPrice: sheets * (settingsData.pricePerSheet || 0),
      status: "pending"
    }

    console.log("Guardando registro:", recordData)
    const docRef = await adminDb.collection("printing_records").add(recordData)
    console.log("Registro guardado con ID:", docRef.id)

    return NextResponse.json({
      id: docRef.id,
      clientName,
      date: dateStr,
      createdAt: recordData.createdAt
    })

  } catch (error) {
    console.error("Failed to create print record:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
