"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import ClientNav from "@/components/client/client-nav"
import MembershipCard from "@/components/client/membership-card"
import ReservationSection from "@/components/client/reservation-section"
import AnnouncementsSection from "@/components/client/announcements-section"
import { useState, useEffect } from "react"

export default function ClientDashboard() {
  const { user, logout, getIdToken } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("resumen")
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration)
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error)
        })
    }

    // Obtener datos del cliente
    const fetchClientData = async () => {
      try {
        const token = await getIdToken()
        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación')
        }
        
        const response = await fetch('/api/client', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) {
          throw new Error('Error al cargar los datos del cliente')
        }
        const data = await response.json()
        setClientData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchClientData()
    }
  }, [user])

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos del plan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-card rounded-lg shadow-md">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error al cargar los datos</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNav user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">¡Bienvenido/a, {user.name}!</h1>
          <p className="text-muted-foreground mt-2">{user.companyName}</p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {["resumen", "reservas", "wifi", "anuncios"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "resumen" && clientData ? (
          <div className="grid gap-6 md:grid-cols-2">
            <MembershipCard plan={clientData.plan} client={clientData} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron datos del plan</p>
          </div>
        )}

        {activeTab === "reservas" && <ReservationSection clientId={clientData?.id || ""} />}

        {activeTab === "wifi" && (
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-bold mb-4">Acceso WiFi</h2>
            <div className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Nombre de la red</p>
                <p className="font-mono text-lg">RamosGenerales-5GHz</p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Contraseña</p>
                <p className="font-mono text-lg">Ramos1234!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "anuncios" && <AnnouncementsSection />}
      </main>
    </div>
  )
}
