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
  const { decodedToken, response } = await ensureAdmin(request)
  if (response) return response

  try {
    const snapshot = await adminDb
      .collection("printing_records")
      .orderBy("createdAt", "desc")
      .get()

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Failed to fetch print records:", error)
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
  }
}
