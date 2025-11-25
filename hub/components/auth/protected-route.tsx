"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import firebaseApp from "@/lib/firebase-client"
import { getMessaging, getToken } from "firebase/messaging"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "client"
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading, getIdToken } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/")
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push("/")
      }
    }
  }, [isLoading, isAuthenticated, user?.role, requiredRole, router])

  // Registrar token FCM para administradores (más sencillo y fiable con Firebase)
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) return
    if (user?.role !== "admin") return

    const registerFcm = async () => {
      try {
        console.log('[FCM] Starting FCM registration for admin user')
        
        if (typeof Notification === 'undefined') {
          console.error('[FCM] Notifications API not available')
          return
        }

        let permission = Notification.permission
        console.log('[FCM] Current notification permission:', permission)
        
        if (permission === 'default') {
          console.log('[FCM] Requesting notification permission...')
          permission = await Notification.requestPermission()
          console.log('[FCM] Permission result:', permission)
        }

        if (permission !== 'granted') {
          console.error('[FCM] Notification permission not granted:', permission)
          return
        }

        console.log('[FCM] Initializing Firebase messaging...')
        const messaging = getMessaging(firebaseApp)
        console.log('[FCM] Messaging instance created:', messaging)
        
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        console.log('[FCM] VAPID key available:', !!vapidKey)
        
        console.log('[FCM] Requesting FCM token...')
        const fcmToken = await getToken(messaging, { vapidKey })
        console.log('[FCM] FCM token received:', fcmToken ? `${fcmToken.substring(0, 50)}...` : 'null')

        if (!fcmToken) {
          console.error('[FCM] No FCM token obtained')
          return
        }

        const idToken = await getIdToken()
        if (!idToken) {
          console.error('[FCM] No ID token available')
          return
        }

        console.log('[FCM] Sending token to server...')
        const res = await fetch('/api/register-fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: fcmToken }),
        })

        const resText = await res.text()
        console.log('[FCM] Server response status:', res.status)
        console.log('[FCM] Server response body:', resText)
        
        if (!res.ok) {
          console.error('[FCM] Registration failed:', res.status, resText)
          return
        }
        
        console.log('[FCM] Registration successful!')
      } catch (err) {
        console.error('[FCM] Error during registration:', err)
      }
    }

    registerFcm()
  }, [isLoading, isAuthenticated, user?.role, getIdToken])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}
