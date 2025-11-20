"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import LoginForm from "@/components/auth/login-form"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/client/dashboard")
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
