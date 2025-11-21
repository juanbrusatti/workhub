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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { id } = params

  const { name, price, billingPeriod, capacity, description } = body as {
    name?: string
    price?: number
    billingPeriod?: BillingPeriod
    capacity?: number
    description?: string | null
  }

  const updates: Record<string, unknown> = {}

  if (name !== undefined) updates.name = name.trim()
  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }
    updates.price = price
  }
  if (capacity !== undefined) {
    if (typeof capacity !== "number" || capacity < 1) {
      return NextResponse.json({ error: "Invalid capacity" }, { status: 400 })
    }
    updates.capacity = capacity
  }
  if (billingPeriod !== undefined) {
    if (!BILLING_PERIODS.includes(billingPeriod)) {
      return NextResponse.json({ error: "Invalid billing period" }, { status: 400 })
    }
    updates.billing_period = billingPeriod
  }
  if (description !== undefined) {
    updates.description = description?.trim() || null
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("membership_plans")
    .update(updates)
    .eq("id", id)
    .select("id, name, price, billing_period, capacity, description, created_at")
    .single()

  if (error) {
    console.error("Failed to update membership plan", error)
    return NextResponse.json({ error: "Failed to update membership plan" }, { status: 500 })
  }

  return NextResponse.json({ plan: data })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { response } = await ensureAdmin(request)
  if (response) return response

  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("membership_plans").delete().eq("id", params.id)

  if (error) {
    console.error("Failed to delete membership plan", error)
    return NextResponse.json({ error: "Failed to delete membership plan" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
