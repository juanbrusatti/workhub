"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import AdminNav from "@/components/admin/admin-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PaymentRequest {
  id: string
  clientId: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  planName: string
  period: string
  dueDate: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function PaymentRequestsPage() {
  const { user, logout, getIdToken } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentRequests()
  }, [])

  const fetchPaymentRequests = async () => {
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }
      
      const response = await fetch('/api/payment-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Error al cargar las solicitudes')
      }
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }

      const response = await fetch(`/api/payment-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action,
          reason: action === 'reject' ? 'Rechazado por administrador' : null
        })
      })

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud')
      }

      // Actualizar la lista de solicitudes
      setRequests(requests.filter(req => req.id !== requestId))
      
      alert(action === 'approve' ? 'Pago aprobado correctamente' : 'Solicitud rechazada')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la solicitud')
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando solicitudes de pago...</p>
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

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Solicitudes de Pago</h1>
          <p className="text-muted-foreground mt-2">Revisa y procesa las solicitudes de pago de los clientes</p>
        </div>

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No hay solicitudes de pago pendientes</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{request.userName}</h3>
                    <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                  </div>
                  <Badge className="bg-yellow-600">Pendiente</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{request.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Período</p>
                    <p className="font-medium">{request.period}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Importe</p>
                    <p className="font-medium">
                      ${request.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  <p>Solicitado: {format(new Date(request.requestDate), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  <p>Vence: {request.dueDate}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleProcessRequest(request.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Aprobar Pago
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleProcessRequest(request.id, 'reject')}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
