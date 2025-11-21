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

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { response } = await ensureAdmin(request)
    if (response) return response

    // En Next.js 16.0.3, los parámetros pueden entregarse como Promise
    const params = await Promise.resolve(context.params)
    const id = params?.id
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del plan no proporcionado" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

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
        return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
      }
      updates.price = price
    }
    if (capacity !== undefined) {
      if (typeof capacity !== "number" || capacity < 1) {
        return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 })
      }
      updates.capacity = capacity
    }
    if (billingPeriod !== undefined) {
      if (!["monthly", "daily", "hourly"].includes(billingPeriod)) {
        return NextResponse.json({ error: "Período de facturación inválido" }, { status: 400 })
      }
      updates.billing_period = billingPeriod
    }
    if (description !== undefined) {
      updates.description = description?.trim() || null
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No se proporcionaron actualizaciones" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    console.log('Actualizando plan con ID:', id, 'Datos:', updates)

    const { data, error: updateError } = await supabase
      .from("membership_plans")
      .update(updates)
      .eq("id", id)
      .select("id, name, price, billing_period, capacity, description, created_at")
      .single()

    if (updateError) {
      console.error("Error al actualizar el plan:", updateError)
      return NextResponse.json(
        { 
          error: "Error al actualizar el plan",
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('Plan actualizado exitosamente:', data)
    return NextResponse.json({ plan: data })
  } catch (error) {
    console.error('Error en el servidor al actualizar el plan:', error)
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar el plan" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { response } = await ensureAdmin(request);
    if (response) return response;

    // En Next.js 16.0.3, los parámetros pueden entregarse como Promise
    const params = await Promise.resolve(context.params)
    const id = params?.id
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del plan no proporcionado" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    console.log('Eliminando plan con ID:', id);

    const { error } = await supabase
      .from("membership_plans")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar el plan:", error)
      return NextResponse.json(
        { 
          error: "Error al eliminar el plan",
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('Plan eliminado exitosamente:', id) // Log de depuración
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en el servidor al eliminar el plan:', error)
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar el plan" },
      { status: 500 }
    )
  }
}
