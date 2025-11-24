import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Obtener datos del cliente desde Firestore
    const clientDoc = await adminDb.collection("clients").doc(uid).get()
    
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const clientData = clientDoc.data()
    if (!clientData) {
      return NextResponse.json({ error: "Client data not found" }, { status: 404 })
    }
    
    // Obtener datos del usuario
    const userDoc = await adminDb.collection("users").doc(uid).get()
    const userData = userDoc.exists ? userDoc.data() : null

    // Obtener los planes de Supabase
    const supabase = getSupabaseAdminClient()
    const { data: plansData, error: plansError } = await supabase
      .from("membership_plans")
      .select("id, name, price, billing_period, capacity, description, created_at")
    
    if (plansError) {
      console.error("Failed to fetch membership plans", plansError)
    }

    // Obtener el plan del cliente si tiene uno asignado
    let planData = null
    if (clientData.planId && plansData) {
      planData = plansData.find(plan => plan.id === clientData.planId)
    }

    // Si no tiene plan, asignar un plan por defecto
    if (!planData) {
      planData = {
        id: "free",
        name: "Plan Gratuito",
        description: "Plan básico con acceso limitado",
        price: 0,
        billing_period: "monthly",
        capacity: 1,
        created_at: new Date().toISOString()
      }
    }

    const response = {
      id: clientDoc.id,
      userId: uid,
      companyName: userData?.companyName || clientData.companyName || "",
      status: clientData.status || "active",
      subscriptionStartDate: clientData.subscriptionStartDate || null,
      subscriptionEndDate: clientData.subscriptionEndDate || null,
      plan: planData,
      createdAt: clientData.createdAt,
      email: userData?.email || "",
      name: userData?.name || ""
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching client data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
