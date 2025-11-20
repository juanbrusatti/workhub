"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
    setIsLoading(true)

    try {
      await login(demoEmail, demoPassword)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="p-8 border-0 shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">CoWorkHub</h1>
        <p className="text-center text-muted-foreground mb-8">Premium coworking space management</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-sm text-muted-foreground mb-3">Demo Accounts:</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-sm bg-transparent"
              onClick={() => handleDemoLogin("admin@coworkhub.com", "admin123")}
              disabled={isLoading}
            >
              Admin Demo
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm bg-transparent"
              onClick={() => handleDemoLogin("alex@company.com", "password123")}
              disabled={isLoading}
            >
              Client Demo (Alex)
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm bg-transparent"
              onClick={() => handleDemoLogin("sarah@design.com", "password123")}
              disabled={isLoading}
            >
              Client Demo (Sarah)
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        This is a demo application. Use the demo accounts to explore.
      </p>
    </div>
  )
}
