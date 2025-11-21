"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"

import { firebaseAuth } from "./firebase-client"
import type { User, UserRole } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const resolveRole = useCallback(
    (claimedRole: unknown, email?: string | null): UserRole => {
      if (claimedRole === "admin" || claimedRole === "client") {
        return claimedRole
      }

      const fallbackAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (fallbackAdminEmail && email && email.toLowerCase() === fallbackAdminEmail.toLowerCase()) {
        return "admin"
      }

      return "client"
    },
    [],
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult(true)
        const determinedRole = resolveRole(tokenResult.claims.role, firebaseUser.email)
        const mappedUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName || firebaseUser.email || "User",
          role: determinedRole,
          companyName: firebaseUser.displayName ? undefined : undefined,
          createdAt: firebaseUser.metadata?.creationTime
            ? new Date(firebaseUser.metadata.creationTime)
            : undefined,
        }

        setUser(mappedUser)
      } catch (error) {
        console.error("Failed to load auth session", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await signOut(firebaseAuth)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getIdToken = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser
    if (!currentUser) return null
    return currentUser.getIdToken()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isAuthenticated: user !== null, getIdToken }}
    >
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
