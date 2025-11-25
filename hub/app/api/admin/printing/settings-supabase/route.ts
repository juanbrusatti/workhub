import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

async function ensureAdmin(request: Request) {
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
    
    if (decodedToken.role !== "admin") {
      console.log("Role check failed:", decodedToken.role)
      return { response: NextResponse.json({ error: "Forbidden - Not an admin" }, { status: 403 }) }
    }
    
    return { user: decodedToken, response: null }
  } catch (error) {
    console.error("Failed to verify admin token:", error)
    return { response: unauthorizedResponse }
  }
}

export async function GET(request: Request) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: settings, error } = await supabase
      .from('printing_settings')
      .select('*')
      .eq('id', 'default')
      .single()
    
    if (error) {
      console.error("Supabase error:", error)
      
      // Si no existe, crear configuración por defecto
      const defaultSettings = {
        id: 'default',
        price_per_sheet: 5, // Default price $5 per sheet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: newSettings, error: insertError } = await supabase
        .from('printing_settings')
        .insert(defaultSettings)
        .select()
        .single()
      
      if (insertError) {
        console.error("Failed to create default settings:", insertError)
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }
      
      return NextResponse.json(newSettings)
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error("Failed to fetch printing settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { user, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const body = await request.json()
    console.log("Request body received:", body)
    
    const { pricePerSheet } = body
    console.log("Extracted pricePerSheet:", pricePerSheet)

    if (typeof pricePerSheet !== "number" || pricePerSheet < 0) {
      console.log("Validation failed:", { pricePerSheet, type: typeof pricePerSheet })
      return NextResponse.json({ error: "Invalid price per sheet" }, { status: 400 })
    }

    if (pricePerSheet > 1000) {
      console.log("Price too high:", pricePerSheet)
      return NextResponse.json({ error: "Maximum price per sheet is $1000" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const updateData = {
      price_per_sheet: pricePerSheet,
      updated_at: new Date().toISOString()
    }

    console.log("Updating printing settings:", updateData)

    const { data: updatedSettings, error: updateError } = await supabase
      .from('printing_settings')
      .update(updateData)
      .eq('id', 'default')
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update settings:", updateError)
      console.error("Error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        error: "Failed to update settings",
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    console.log("Settings updated successfully:", updatedSettings)
    return NextResponse.json(updatedSettings)

  } catch (error) {
    console.error("Failed to update printing settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
