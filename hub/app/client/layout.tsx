import type React from "react"

import ProtectedRoute from "@/components/auth/protected-route"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="client">
      <PWAInstallPrompt />
      {children}
    </ProtectedRoute>
  )
}
