import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

async function ensureAdmin(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { response: unauthorizedResponse }
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (decodedToken.role !== "admin") {
      return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
    }
    return { decodedToken, response: null }
  } catch (error) {
    console.error("Failed to verify admin token", error)
    return { response: unauthorizedResponse }
  }
}

export async function GET(request: Request) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  try {
    const doc = await adminDb.collection("printing_settings").doc("default").get()
    
    if (!doc.exists) {
      // Create default settings if they don't exist
      const defaultSettings = {
        pricePerSheet: 5, // Default price $0.05 per sheet
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await adminDb.collection("printing_settings").doc("default").set(defaultSettings)
      return NextResponse.json(defaultSettings)
    }

    const settings = doc.data()
    return NextResponse.json(settings)

  } catch (error) {
    console.error("Failed to fetch printing settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { decodedToken, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const { pricePerSheet } = await request.json()

    if (!pricePerSheet || typeof pricePerSheet !== "number" || pricePerSheet <= 0) {
      return NextResponse.json({ error: "Invalid price per sheet" }, { status: 400 })
    }

    if (pricePerSheet > 100) {
      return NextResponse.json({ error: "Maximum price per sheet is $100" }, { status: 400 })
    }

    const updateData = {
      pricePerSheet,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedToken.uid,
      updatedByName: decodedToken.name || "Admin"
    }

    await adminDb.collection("printing_settings").doc("default").update(updateData)

    const updatedDoc = await adminDb.collection("printing_settings").doc("default").get()
    const updatedSettings = updatedDoc.data()

    return NextResponse.json(updatedSettings)

  } catch (error) {
    console.error("Failed to update printing settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
