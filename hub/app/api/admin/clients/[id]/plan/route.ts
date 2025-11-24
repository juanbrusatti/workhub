import { NextRequest, NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = { error: "No autorizado" }
const forbiddenResponse = { error: "Acceso denegado" }

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params

    if (!clientId) {
      return NextResponse.json({ error: "ID de cliente no proporcionado" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(unauthorizedResponse, { status: 401 })
    }

    const idToken = authHeader.split(" ")[1]

    const decodedToken = await adminAuth.verifyIdToken(idToken).catch((error) => {
      console.error("Fallo al verificar el token de admin", error)
      return null
    })

    if (!decodedToken) {
      return NextResponse.json(unauthorizedResponse, { status: 401 })
    }

    if (decodedToken.role !== "admin") {
      return NextResponse.json(forbiddenResponse, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.planId !== "string") {
      return NextResponse.json({ error: "planId es requerido" }, { status: 400 })
    }

    const planId = body.planId.trim()
    if (!planId) {
      return NextResponse.json({ error: "planId no puede estar vacío" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("id, name, price, billing_period, capacity, description, created_at")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      console.error("Plan no encontrado", planError)
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    await adminDb.collection("clients").doc(clientId).update({
      planId,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error("Error actualizando el plan del cliente", error)
    return NextResponse.json({ error: "Error al actualizar el plan" }, { status: 500 })
  }
}
