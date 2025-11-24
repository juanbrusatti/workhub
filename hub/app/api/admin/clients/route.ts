import { NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const forbiddenResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 })

type FirestoreClient = {
  id: string
  userId: string
  email: string
  name: string
  companyName?: string | null
  planId?: string | null
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

type PlanRecord = {
  id: string
  name: string
  price: number
  billing_period: "monthly" | "daily" | "hourly"
  capacity: number
  description: string | null
  created_at: string
}

async function ensureAdmin(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { response: unauthorizedResponse }
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (decodedToken.role !== "admin") {
      return { response: forbiddenResponse }
    }
  } catch (error) {
    console.error("Failed to verify admin token", error)
    return { response: unauthorizedResponse }
  }

  return { response: null }
}

export async function GET(request: Request) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  try {
    const supabase = getSupabaseAdminClient()

    const [{ data: plansData, error: plansError }, snapshot] = await Promise.all([
      supabase
        .from("membership_plans")
        .select("id, name, price, billing_period, capacity, description, created_at"),
      adminDb.collection("clients").get(),
    ])

    if (plansError) {
      console.error("Failed to fetch membership plans", plansError)
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
    }

    const plansMap = new Map<string, PlanRecord>()
    plansData?.forEach((plan) => plansMap.set(plan.id, plan as PlanRecord))

    const clients = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreClient
      const plan = data.planId ? plansMap.get(data.planId) : undefined

      return {
        id: data.id,
        userId: data.userId,
        user: {
          id: data.userId,
          email: data.email,
          name: data.name,
          role: "client" as const,
          companyName: data.companyName ?? "",
          createdAt: data.createdAt,
        },
        companyName: data.companyName ?? "",
        plan: plan || null,
        subscriptionStartDate: data.createdAt,
        subscriptionEndDate: null,
        status: data.status,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Failed to fetch clients", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
