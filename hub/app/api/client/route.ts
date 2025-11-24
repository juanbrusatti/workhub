import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSupabaseAdminClient } from "@/lib/supabase"

const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export async function GET(request: Request) {
  console.log('GET /api/client - Starting request')
  
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    console.log('No authorization header or invalid format')
    return unauthorizedResponse
  }

  const idToken = authHeader.split(" ")[1]
  console.log('Token extracted, verifying...')

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid
    console.log('Token verified for user:', uid)

    // Obtener datos del cliente desde Firestore
    console.log('Fetching client data for uid:', uid)
    const clientDoc = await adminDb.collection("clients").doc(uid).get()
    
    if (!clientDoc.exists) {
      console.log('Client document not found for uid:', uid)
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const clientData = clientDoc.data()
    if (!clientData) {
      console.log('Client data is null/undefined')
      return NextResponse.json({ error: "Client data not found" }, { status: 404 })
    }
    
    console.log('Client data:', clientData)
    
    // Obtener datos del usuario
    console.log('Fetching user data...')
    const userDoc = await adminDb.collection("users").doc(uid).get()
    const userData = userDoc.exists ? userDoc.data() : null
    console.log('User data:', userData)

    // Obtener los planes de Supabase
    console.log('Fetching membership plans from Supabase...')
    const supabase = getSupabaseAdminClient()
    const { data: plansData, error: plansError } = await supabase
      .from("membership_plans")
      .select("id, name, price, billing_period, capacity, description, created_at")
    
    if (plansError) {
      console.error("Failed to fetch membership plans", plansError)
    } else {
      console.log('Plans fetched:', plansData?.length || 0, 'plans')
    }

    // Obtener el plan del cliente si tiene uno asignado
    let planData = null
    console.log('Client planId:', clientData.planId)
    
    if (clientData.planId && plansData) {
      planData = plansData.find(plan => plan.id === clientData.planId)
      console.log('Found plan data:', planData)
    }

    // Si no tiene plan, asignar un plan por defecto
    if (!planData) {
      console.log('No plan found, assigning free plan')
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

    console.log('Final response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching client data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
