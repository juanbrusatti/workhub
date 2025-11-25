import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET() {
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
