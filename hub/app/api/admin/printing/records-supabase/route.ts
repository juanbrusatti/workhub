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
  const { user, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const supabase = getSupabaseAdminClient()
    console.log("GET printing_records (ADMIN) - User:", user.uid)
    
    const { data: records, error } = await supabase
      .from('printing_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }

    console.log("Registros encontrados (ADMIN):", records?.length || 0)

    return NextResponse.json({ records: records || [] })
  } catch (error) {
    console.error("Failed to fetch print records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}
