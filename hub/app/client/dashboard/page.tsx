"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import ClientNav from "@/components/client/client-nav"
import MembershipCard from "@/components/client/membership-card"
import ReservationSection from "@/components/client/reservation-section"
import AnnouncementsSection from "@/components/client/announcements-section"
import PrintingSection from "@/components/client/printing-section"
import QuickPrintAction from "@/components/client/quick-print-action"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Wifi } from "lucide-react"
import { useState, useEffect } from "react"

export default function ClientDashboard() {
  const { user, logout, getIdToken } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("resumen")
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

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

  const handleViewPrintingDetails = () => {
    // Mostrar la vista de impresiones directamente sin cambiar el tab
    setActiveTab("impresiones")
  }

  const togglePasswordVisibility = (networkId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [networkId]: !prev[networkId]
    }))
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
            <QuickPrintAction onViewDetails={handleViewPrintingDetails} />
          </div>
        ) : activeTab === "resumen" && !clientData ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron datos del plan</p>
          </div>
        ) : null}

        {activeTab === "reservas" && <ReservationSection clientId={clientData?.id || ""} />}

        {activeTab === "wifi" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Acceso WiFi</h2>
            
            {/* Red OficinaAlvear */}
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">OficinaAlvear</h3>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Nombre de red</p>
                  <p className="font-mono text-sm">OficinaAlvear</p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Contraseña</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm">
                      {showPasswords.oficinaAlvear ? 'Alvear1147' : '••••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePasswordVisibility('oficinaAlvear')}
                      className="h-8 w-8 p-0"
                    >
                      {showPasswords.oficinaAlvear ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Red Copada */}
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Red Copada</h3>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Nombre de red</p>
                  <p className="font-mono text-sm">Red Copada</p>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Contraseña</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm">
                      {showPasswords.redCopada ? 'londonlondon' : '••••••••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePasswordVisibility('redCopada')}
                      className="h-8 w-8 p-0"
                    >
                      {showPasswords.redCopada ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "anuncios" && <AnnouncementsSection />}

        {/* Vista de impresiones (accesible solo desde "Ver detalles") */}
        {activeTab === "impresiones" && (
          <div>
            <div className="flex items-center gap-2 mb-6">
            </div>
            <PrintingSection clientId={clientData?.id || ""} />
          </div>
        )}
      </main>
    </div>
  )
}
