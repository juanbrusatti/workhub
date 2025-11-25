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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { decodedToken, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const recordId = params.id

    // Check if record exists
    const recordDoc = await adminDb.collection("printing_records").doc(recordId).get()
    if (!recordDoc.exists) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const recordData = recordDoc.data()
    if (!recordData) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    
    if (recordData.status === "paid") {
      return NextResponse.json({ error: "Record already paid" }, { status: 400 })
    }

    // Update record status to paid
    await adminDb.collection("printing_records").doc(recordId).update({
      status: "paid",
      paidAt: new Date().toISOString(),
      paidBy: decodedToken.uid,
      paidByName: decodedToken.name || "Admin"
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Failed to mark record as paid:", error)
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}
