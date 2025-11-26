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
          <div className="p-8 -mx-8 -my-8">
            <div className="relative z-10">
              {/* Título elegante */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Acceso WiFi
                </h2>
                <p className="text-gray-600 text-lg">Conéctate a nuestras redes de alta velocidad</p>
              </div>

              {/* Contenedor de redes */}
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                
                {/* Red OficinaAlvear - Estilo elegante azul */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    
                    {/* Icono WiFi elegante */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Wifi className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">OficinaAlvear</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wider">Nombre de Red</p>
                        <p className="text-gray-900 font-mono text-lg">OficinaAlvear</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wider">Contraseña</p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 font-mono text-lg">
                            {showPasswords.oficinaAlvear ? 'Alvear1147' : '••••••••'}
                          </p>
                          <button
                            onClick={() => togglePasswordVisibility('oficinaAlvear')}
                            className="ml-4 p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            {showPasswords.oficinaAlvear ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Red Copada - Estilo elegante morado */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    
                    {/* Icono WiFi elegante */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl opacity-50"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Wifi className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Red Copada</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wider">Nombre de Red</p>
                        <p className="text-gray-900 font-mono text-lg">Red Copada</p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-500 text-xs mb-2 font-medium uppercase tracking-wider">Contraseña</p>
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 font-mono text-lg">
                            {showPasswords.redCopada ? 'londonlondon' : '••••••••••••'}
                          </p>
                          <button
                            onClick={() => togglePasswordVisibility('redCopada')}
                            className="ml-4 p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            {showPasswords.redCopada ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto inferior elegante */}
              <div className="text-center mt-12">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">
                    Conexión estable y segura
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
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
