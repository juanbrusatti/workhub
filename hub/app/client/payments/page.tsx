"use client"

import { useAuth } from "@/lib/auth-context"
import ClientNav from "@/components/client/client-nav"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { format } from "date-fns"

export default function PaymentsPage() {
  const { user, logout, getIdToken } = useAuth()
  const router = useRouter()
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calcular próximo período de pago
  const getNextPaymentPeriod = () => {
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    let nextMonth = currentMonth
    let nextYear = currentYear
    
    // Si estamos después del día 10, el próximo pago es el mes siguiente
    if (currentDay > 10) {
      nextMonth = currentMonth + 1
      if (nextMonth > 11) {
        nextMonth = 0
        nextYear = currentYear + 1
      }
    }
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    return {
      period: `${monthNames[nextMonth]} ${nextYear}`,
      dueDate: `10 de ${monthNames[nextMonth]} de ${nextYear}`,
      isOverdue: currentDay > 10
    }
  }
  
  const nextPayment = getNextPaymentPeriod()
  // Historial de pagos harcodeado
  const [paymentHistory] = useState([
    {
      id: "1",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 15000,
      plan: "Plan Profesional",
      period: "Noviembre 2024",
      status: "pagado" as const,
      transactionId: "TXN-2024-001",
    },
    {
      id: "2",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      amount: 15000,
      plan: "Plan Profesional",
      period: "Octubre 2024",
      status: "pagado" as const,
      transactionId: "TXN-2024-002",
    },
    {
      id: "3",
      date: new Date(),
      amount: 15000,
      plan: "Plan Profesional",
      period: nextPayment.period,
      status: "pendiente" as const,
      transactionId: "TXN-2024-003",
    },
  ])

  useEffect(() => {
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
  }, [user, getIdToken])

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos de facturación...</p>
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
          <h1 className="text-4xl font-bold">Facturación y Pagos</h1>
          <p className="text-muted-foreground mt-2">Gestiona tu suscripción y historial de pagos</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Detalles del Plan Actual */}
          <Card className="p-6 border-2 border-primary/20">
            <h3 className="text-xl font-bold mb-4">Detalles del Plan</h3>
            {clientData?.plan ? (
              <>
                <div className="mb-6">
                  <Badge className={clientData.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
                    {clientData.status === 'active' ? 'Activo' : clientData.status === 'inactive' ? 'Inactivo' : 'Suspendido'}
                  </Badge>
                  <p className="text-3xl font-bold">{clientData.plan.name}</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    ${(clientData.plan as any).price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    /{(clientData.plan as any).billing_period === 'monthly' ? 'mes' : (clientData.plan as any).billing_period === 'daily' ? 'día' : 'hora'}
                  </p>
                </div>

                <div className="space-y-2 mb-6 p-3 bg-secondary/50 rounded">
                  <p className="text-sm">
                    <strong>Descripción:</strong> {clientData.plan.description}
                  </p>
                  <p className="text-sm">
                    <strong>Capacidad:</strong> {(clientData.plan as any).capacity || 1} {(clientData.plan as any).capacity === 1 ? 'persona' : 'personas'}
                  </p>
                </div>

                <Button className="w-full mb-2">
                  Pagar Ahora
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No hay plan asignado</p>
            )}
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push("/client/dashboard")}
            >
              Volver al Dashboard
            </Button>
          </Card>

          {/* Próximo Pago */}
          <Card className="p-6 border">
            <h3 className="text-xl font-bold mb-4">Próximo Pago</h3>
            <div className="space-y-4">
              <div className={`p-4 ${nextPayment.isOverdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-800">Estado</span>
                  <Badge className={nextPayment.isOverdue ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}>
                    {nextPayment.isOverdue ? 'Vencido' : 'Pendiente de pago'}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-red-800">{nextPayment.period}</p>
                <p className="text-sm text-red-700">Vence el {nextPayment.dueDate}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Período de pago</p>
                <p className="font-semibold">Del 1 al 10 de cada mes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Historial de Pagos */}
        <Card className="p-6 border">
          <h3 className="text-2xl font-bold mb-6">Historial de Pagos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-3">Período</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Importe</th>
                  <th className="text-left py-3">Estado</th>
                  <th className="text-left py-3">ID Transacción</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3">{payment.period}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3 font-semibold">
                      ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3">
                      <Badge className={payment.status === 'pagado' ? 'bg-green-600' : 'bg-yellow-600'}>
                        {payment.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs font-mono">{payment.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
