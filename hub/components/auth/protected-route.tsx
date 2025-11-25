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
        if (typeof Notification === 'undefined') {
          console.log('Notifications API not available')
          return
        }

        let permission = Notification.permission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
        }

        if (permission !== 'granted') {
          console.log('Notification permission not granted:', permission)
          return
        }

        console.log('Initializing FCM...')
        const messaging = getMessaging(firebaseApp)
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const fcmToken = await getToken(messaging, { vapidKey })

        if (!fcmToken) {
          console.log('FCM: no token obtained')
          return
        }

        console.log('FCM token obtained:', fcmToken)

        const idToken = await getIdToken()
        if (!idToken) return

        const res = await fetch('/api/register-fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: fcmToken }),
        })

        console.log('register-fcm-token response', res.status, await res.text())
      } catch (err) {
        console.error('Failed to register FCM token', err)
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
