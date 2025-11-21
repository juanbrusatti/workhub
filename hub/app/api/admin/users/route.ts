import { NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } catch (error) {
    console.error("Failed to verify admin token", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { email, password, name, companyName, planId } = body as {
    email?: string
    password?: string
    name?: string
    companyName?: string
    planId?: string
  }

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "client" })

    await adminDb.collection("clients").doc(userRecord.uid).set({
      id: userRecord.uid,
      userId: userRecord.uid,
      email,
      name,
      companyName: companyName || null,
      planId: planId || null,
      status: "active",
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ id: userRecord.uid }, { status: 201 })
  } catch (error) {
    console.error("Failed to create client", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
