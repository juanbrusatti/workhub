"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "./types"
import { mockAdminUser, mockClientUser } from "./mock-data"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("coworkhub_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock authentication with test credentials
    let authenticatedUser: User | null = null

    if (email === "admin@coworkhub.com" && password === "admin123") {
      authenticatedUser = mockAdminUser
    } else if (email === "alex@company.com" && password === "password123") {
      authenticatedUser = mockClientUser
    } else if (email === "sarah@design.com" && password === "password123") {
      authenticatedUser = { ...mockClientUser, id: "user3", email, name: "Sarah Design" }
    }

    if (!authenticatedUser) {
      throw new Error("Invalid email or password")
    }

    setUser(authenticatedUser)
    localStorage.setItem("coworkhub_user", JSON.stringify(authenticatedUser))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("coworkhub_user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: user !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
