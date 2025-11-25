import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

/**
 * Test endpoint to manually send a test notification to all admin tokens.
 * Call with: POST /api/test-fcm with Authorization header
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const idToken = authHeader.split(" ")[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log('[TEST-FCM] Fetching all admin FCM tokens...')
    const tokensSnapshot = await adminDb.collection("fcm_tokens").where("role", "==", "admin").get()
    const tokens = tokensSnapshot.docs.map(d => d.data().token).filter(Boolean) as string[]

    console.log('[TEST-FCM] Found', tokens.length, 'admin tokens')

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, message: "No admin tokens found" }, { status: 200 })
    }

    const message = {
      notification: {
        title: 'Notificación de Prueba',
        body: 'Esta es una notificación de prueba desde el API test-fcm',
      },
      data: {
        url: '/admin/payment-requests',
        testMessage: 'true',
      },
    }

    const adminSdk = await import('firebase-admin')
    const response = await (adminSdk.messaging() as any).sendMulticast({
      tokens,
      notification: message.notification,
      data: message.data,
    } as any)

    console.log('[TEST-FCM] Test message result - Success:', response.successCount, 'Failure:', response.failureCount)

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${response.successCount} devices`,
      result: {
        totalTokens: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      }
    })
  } catch (error) {
    console.error('[TEST-FCM] Error:', error)
    return NextResponse.json({ error: "Error sending test notification", details: String(error) }, { status: 500 })
  }
}
