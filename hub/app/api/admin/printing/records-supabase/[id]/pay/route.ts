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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const { id: recordId } = await params
    console.log("Marking record as paid:", recordId)

    const supabase = getSupabaseAdminClient()

    // Check if record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('printing_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !existingRecord) {
      console.log("Record not found:", recordId)
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    if (existingRecord.status === "paid") {
      console.log("Record already paid:", recordId)
      return NextResponse.json({ error: "Record already paid" }, { status: 400 })
    }

    // Update record status to paid
    const updateData = {
      status: "paid",
      paid_at: new Date().toISOString()
    }

    console.log("Updating record:", { recordId, updateData })

    const { data: updatedRecord, error: updateError } = await supabase
      .from('printing_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update record:", updateError)
      console.error("Error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json({ 
        error: "Failed to update record",
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    console.log("Record marked as paid successfully:", updatedRecord)
    return NextResponse.json({ success: true, record: updatedRecord })

  } catch (error) {
    console.error("Failed to mark record as paid:", error)
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}
