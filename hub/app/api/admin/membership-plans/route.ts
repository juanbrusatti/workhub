import { NextResponse } from "next/server"

import { adminAuth } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const BILLING_PERIODS = ["monthly", "daily", "hourly"] as const

type BillingPeriod = (typeof BILLING_PERIODS)[number]

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const forbiddenResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 })

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

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("membership_plans")
    .select("id, name, price, billing_period, capacity, description, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch membership plans", error)
    return NextResponse.json({ error: "Failed to fetch membership plans" }, { status: 500 })
  }

  return NextResponse.json({ plans: data })
}

export async function POST(request: Request) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { name, price, billingPeriod, capacity, description } = body as {
    name?: string
    price?: number
    billingPeriod?: BillingPeriod
    capacity?: number
    description?: string
  }

  if (!name?.trim() || typeof price !== "number" || typeof capacity !== "number" || !billingPeriod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!BILLING_PERIODS.includes(billingPeriod)) {
    return NextResponse.json({ error: "Invalid billing period" }, { status: 400 })
  }

  if (price < 0 || capacity < 1) {
    return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      name: name.trim(),
      price,
      billing_period: billingPeriod,
      capacity,
      description: description?.trim() || null,
    })
    .select("id, name, price, billing_period, capacity, description, created_at")
    .single()

  if (error) {
    console.error("Failed to create membership plan", error)
    return NextResponse.json({ error: "Failed to create membership plan" }, { status: 500 })
  }

  return NextResponse.json({ plan: data }, { status: 201 })
}
