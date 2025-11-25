"use client"

import { useAuth } from "@/lib/auth-context"
import ClientNav from "@/components/client/client-nav"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { format } from "date-fns"

function PaymentsPage() {
  const { user, logout, getIdToken } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [clientData, setClientData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)

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
      isOverdue: false // Por defecto no está vencido hasta que se carguen los datos reales
    }
  }

  const nextPayment = getNextPaymentPeriod()
  // Historial de pagos dinámico
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [nextPaymentInfo, setNextPaymentInfo] = useState(nextPayment)
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Estado para control de solicitudes duplicadas
  const [hasExistingRequest, setHasExistingRequest] = useState(false)
  const [checkingRequest, setCheckingRequest] = useState(false)
  
  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = paymentHistory.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage)
  
  // Resetear página cuando cambia el historial
  useEffect(() => {
    setCurrentPage(1)
  }, [paymentHistory])

  // Verificar si existe solicitud pendiente para el período actual
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user || !clientData || !nextPaymentInfo.period) return
      
      try {
        setCheckingRequest(true)
        const token = await getIdToken()
        if (!token) return

        const response = await fetch('/api/payment-requests/check-existing', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            period: nextPaymentInfo.period,
            userId: user.id,
            clientId: clientData.id 
          })
        })

        if (response.ok) {
          const data = await response.json()
          setHasExistingRequest(data.exists)
        }
      } catch (error) {
        console.error('Error checking existing request:', error)
      } finally {
        setCheckingRequest(false)
      }
    }

    checkExistingRequest()
  }, [user, clientData, nextPaymentInfo.period, getIdToken])

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
        console.log('Client data received:', data)
        setClientData(data)
        
        // Actualizar el próximo período de pago desde los datos del cliente
        if (data && data.nextPaymentPeriod) {
          console.log('Updating nextPaymentInfo with:', data.nextPaymentPeriod)
          setNextPaymentInfo({
            period: data.nextPaymentPeriod,
            dueDate: `10 de ${data.nextPaymentPeriod}`,
            isOverdue: false // Si tiene nextPaymentPeriod asignado, no está vencido
          })
        } else {
          console.log('No nextPaymentPeriod found in data:', data)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
        
        // Cargar historial de pagos
        try {
          const historyResponse = await fetch("/api/payment-history", {
            headers: {
              "Authorization": `Bearer ${await getIdToken()}`
            }
          })
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json()
            setPaymentHistory(historyData.payments || [])
          }
        } catch (historyErr) {
          console.error("Error loading payment history:", historyErr)
        } finally {
          setLoadingHistory(false)
        }      }
    }

    if (user) {
      fetchClientData()
    }
  }, [user, getIdToken])

  // Auto-refresco cada 30 segundos para actualizar próximo período
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      await refreshClientData()
    }, 60000) // 30 segundos

    return () => clearInterval(interval)
  }, [user, getIdToken])

  const refreshClientData = async () => {
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }
      
      console.log('Refreshing client data...')
      const response = await fetch('/api/refresh-client', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al refrescar los datos del cliente')
      }
      
      const data = await response.json()
      console.log('Refreshed client data:', data)
        console.log('nextPaymentPeriod from server:', data.nextPaymentPeriod)
      setClientData(data)
      
      // Actualizar el próximo período de pago desde los datos del cliente
      if (data && data.nextPaymentPeriod) {
        setNextPaymentInfo({
          period: data.nextPaymentPeriod,
          dueDate: `10 de ${data.nextPaymentPeriod}`,
          isOverdue: data.paymentStatus !== 'active'
        })
      }
      
      // También refrescar el historial de pagos
      const historyResponse = await fetch('/api/payment-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setPaymentHistory(historyData.payments || [])
        setLoadingHistory(false)
      }
      
      // Verificar si existe solicitud para el nuevo período
      if (data && data.nextPaymentPeriod) {
        try {
          const checkResponse = await fetch('/api/payment-requests/check-existing', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              period: data.nextPaymentPeriod,
              userId: user.id,
              clientId: data.id 
            })
          })

          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            setHasExistingRequest(checkData.exists)
          }
        } catch (error) {
          console.error('Error checking existing request:', error)
        }
      }
      
    } catch (err) {
      console.error('Error al refrescar datos:', err)
    }
  }

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
        console.log('Client data received:', data)
        setClientData(data)
        
        // Actualizar el próximo período de pago desde los datos del cliente
        if (data && data.nextPaymentPeriod) {
          console.log('Updating nextPaymentInfo with:', data.nextPaymentPeriod)
          setNextPaymentInfo({
            period: data.nextPaymentPeriod,
            dueDate: `10 de ${data.nextPaymentPeriod}`,
            isOverdue: false // Si tiene nextPaymentPeriod asignado, no está vencido
          })
        } else {
          console.log('No nextPaymentPeriod found in data:', data)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
        
        // Cargar historial de pagos
        try {
          const historyResponse = await fetch("/api/payment-history", {
            headers: {
              "Authorization": `Bearer ${await getIdToken()}`
            }
          })
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json()
            setPaymentHistory(historyData.payments || [])
        setLoadingHistory(false)          }
        } catch (historyErr) {
          console.error("Error loading payment history:", historyErr)
        } finally {
          setLoadingHistory(false)
        }      }
    }

    if (user) {
      fetchClientData()
    }
  }, [user, getIdToken])

  // Auto-refresco cada 30 segundos para actualizar próximo período
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      await refreshClientData()
    }, 60000) // 30 segundos

    return () => clearInterval(interval)
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

  const handleCopyAlias = () => {
    const alias = "RamosGenerales.mp"
    
    navigator.clipboard.writeText(alias).then(() => {
      toast({
        title: "Alias copiado",
        description: "RamosGenerales.mp se ha copiado al portapapeles",
      })
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar el alias",
        variant: "destructive",
      })
    })
  }

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, soy ${user.name} y quiero enviar el comprobante de pago del período ${nextPaymentInfo.period}. Mi email es ${user.email}.`
    )
    window.open(`https://wa.me/5491112345678?text=${message}`, '_blank')
  }

  const checkExistingPaymentRequest = async (period: string, token: string) => {
    try {
      console.log('Checking existing request for period:', period)
      console.log('User ID:', user.id)
      console.log('Client ID:', clientData.id)
      
      const response = await fetch('/api/payment-requests/check-existing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          period,
          userId: user.id,
          clientId: clientData.id 
        })
      })

      console.log('Check response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Check response data:', data)
        return data.exists // true si existe, false si no
      } else {
        console.log('Check response not ok:', response.status)
        const errorData = await response.json()
        console.log('Error response:', errorData)
      }
      return false // Si hay error, permitimos continuar
    } catch (error) {
      console.error('Error checking existing request:', error)
      return false // Si hay error, permitimos continuar
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      console.log('=== handleMarkAsPaid START ===')
      console.log('Current period:', nextPaymentInfo.period)
      console.log('User exists:', !!user)
      console.log('Client data exists:', !!clientData)
      
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }

      console.log('Token obtained successfully')

      // Verificar si ya existe una solicitud para este período
      const existingRequest = await checkExistingPaymentRequest(nextPaymentInfo.period, token)
      console.log('Existing request check result:', existingRequest)
      
      if (existingRequest) {
        console.log('Blocking duplicate request')
        toast({
          title: "Solicitud duplicada",
          description: `Ya existe una solicitud de pago para el período ${nextPaymentInfo.period}. Debes esperar hasta el próximo mes para generar una nueva solicitud.`,
          variant: "destructive"
        })
        return
      }

      console.log('Proceeding with payment request creation...')

      const paymentRequest = {
        clientId: clientData.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: (clientData.plan as any).price,
        planName: clientData.plan.name,
        period: nextPaymentInfo.period,
        dueDate: nextPaymentInfo.dueDate,
        requestDate: new Date().toISOString(),
        status: 'pending'
      }

      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      })

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud de pago')
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de pago ha sido enviada al administrador",
      })
      
      setShowTransferModal(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de pago",
        variant: "destructive",
      })
    }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Detalles del Plan</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshClientData}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar
              </Button>
            </div>
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

                <Button 
                  className="w-full mb-2"
                  onClick={() => setShowTransferModal(true)}
                >
                  Pagar Ahora
                </Button>

                {/* Modal de Transferencia */}
                {showTransferModal && (
                  <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-gray-300 shadow-2xl">
                      <h3 className="text-xl font-bold mb-4">Pagar por Transferencia</h3>
                      
                      <div className="space-y-4 mb-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Datos para la transferencia:</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Alias:</span>
                              <span className="font-mono text-sm">RamosGenerales.mp</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">CBU/CVU:</span>
                              <span className="font-mono text-xs">00000031000000000000000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Titular:</span>
                              <span className="text-sm">Ramos Generales S.A.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">CUIT:</span>
                              <span className="text-sm">30-12345678-9</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 mb-1">Importe a transferir:</p>
                          <p className="text-2xl font-bold text-yellow-800">
                            ${(clientData.plan as any).price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">Referencia: {nextPaymentInfo.period}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Período de pago</p>
                          <p className="font-semibold">Del 1 al 10 de cada mes</p>
                          <p className="text-xs text-muted-foreground mt-1">Vence el {nextPaymentInfo.dueDate}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowTransferModal(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleCopyAlias}
                        >
                          Copiar Alias
                        </Button>
                      </div>

                      <Button
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                        onClick={handleMarkAsPaid}
                        disabled={hasExistingRequest || checkingRequest}
                      >
                        {checkingRequest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Verificando...
                          </>
                        ) : hasExistingRequest ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Solicitud ya enviada
                          </>
                        ) : (
                          'Marcar como Pagado'
                        )}
                      </Button>

                      {hasExistingRequest && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Atención:</strong> Ya existe una solicitud de pago para el período {nextPaymentInfo.period}. 
                            Debes esperar hasta el próximo mes para generar una nueva solicitud.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          Una vez realizada la transferencia, envía el comprobante a:
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">WhatsApp:</span>
                          <span className="text-sm">+54 9 11 1234-5678</span>
                          <Button size="sm" variant="outline" onClick={handleOpenWhatsApp}>
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <div className={`p-4 ${nextPaymentInfo.isOverdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-800">Estado</span>
                  <Badge className={nextPaymentInfo.isOverdue ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}>
                    {nextPaymentInfo.isOverdue ? 'Vencido' : 'Pendiente de pago'}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-red-800">{nextPaymentInfo.period}</p>
                <p className="text-sm text-red-700">Vence el {nextPaymentInfo.dueDate}</p>
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
          
          {/* Info de paginación en mobile */}
          {paymentHistory.length > itemsPerPage && (
            <div className="mb-4 text-sm text-muted-foreground text-center sm:hidden">
              Página {currentPage} de {totalPages} ({paymentHistory.length} pagos totales)
            </div>
          )}
          
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-3">Período</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Importe</th>
                  <th className="text-left py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3">{payment.period}</td>
                    <td className="py-3">{payment.planName}</td>
                    <td className="py-3 font-semibold">
                      ${payment.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3">
                      <Badge className={payment.status === 'pagado' ? 'bg-green-600' : 'bg-yellow-600'}>
                        {payment.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && !loadingHistory && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No hay pagos registrados
                    </td>
                  </tr>
                )}
                {loadingHistory && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Controles de paginación */}
          {paymentHistory.length > itemsPerPage && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, paymentHistory.length)} de {paymentHistory.length} pagos
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                
                {/* Números de página - solo en desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Mostrar páginas inteligentemente: 1, ..., current-1, current, current+1, ..., last
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0 text-sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                {/* Indicador de página actual en mobile */}
                <div className="sm:hidden text-sm font-medium px-2">
                  {currentPage}/{totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1"
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
      <Toaster />
    </div>
  )
}

export default PaymentsPage
