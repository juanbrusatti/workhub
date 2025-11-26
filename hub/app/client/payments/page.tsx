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
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [printRecords, setPrintRecords] = useState<any[]>([])
  const [loadingPrintRecords, setLoadingPrintRecords] = useState(false)
  const [paymentType, setPaymentType] = useState<'membership' | 'printing' | 'both'>('membership')

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
  
  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = paymentHistory.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage)
  
  // Resetear página cuando cambia el historial
  useEffect(() => {
    setCurrentPage(1)
  }, [paymentHistory])

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
      fetchPendingPrintRecords()
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
        setLoadingHistory(false)      }
      
    } catch (err) {
      console.error('Error al refrescar datos:', err)
    }
  }

  // Función para obtener impresiones pendientes del mes actual
  const fetchPendingPrintRecords = async () => {
    try {
      setLoadingPrintRecords(true)
      const token = await getIdToken()
      if (!token) return

      const response = await fetch(`/api/client/printing/records-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const records = data.records || []
        
        // Filtrar solo las impresiones pendientes del mes actual
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const pendingRecords = records.filter((record: any) => {
          if (record.status !== 'pending') return false
          
          const recordDate = new Date(record.date)
          return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
        })
        
        setPrintRecords(pendingRecords)
        console.log('Impresiones pendientes del mes:', pendingRecords)
      }
    } catch (error) {
      console.error("Error fetching print records:", error)
    } finally {
      setLoadingPrintRecords(false)
    }
  }

  // Calcular totales de impresiones pendientes
  const calculatePendingPrintingTotal = () => {
    return printRecords.reduce((sum, record) => sum + record.total_price, 0)
  }

  const calculatePendingPrintingSheets = () => {
    return printRecords.reduce((sum, record) => sum + record.sheets, 0)
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
      fetchPendingPrintRecords()
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

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "El archivo debe ser una imagen (JPG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        })
        return
      }

      setReceiptFile(file)
      
      // Crear vista previa
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const handleMarkAsPaid = async () => {
    if (!receiptFile) {
      toast({
        title: "Error",
        description: "Por favor, adjunta el comprobante de pago",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }

      // Convertir la imagen a base64
      const reader = new FileReader()
      const receiptBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(receiptFile)
      })

      // Calcular montos según el tipo de pago
      let amount = 0
      let description = ''
      let includePrintRecords = false

      if (paymentType === 'membership') {
        amount = (clientData.plan as any).price
        description = `Mensualidad - ${clientData.plan.name}`
      } else if (paymentType === 'printing') {
        amount = calculatePendingPrintingTotal()
        description = `Impresiones pendientes - ${calculatePendingPrintingSheets()} hojas`
        includePrintRecords = true
      } else if (paymentType === 'both') {
        amount = ((clientData.plan as any).price || 0) + calculatePendingPrintingTotal()
        description = `Mensualidad + Impresiones - ${clientData.plan.name} + ${calculatePendingPrintingSheets()} hojas`
        includePrintRecords = true
      }

      const paymentRequest = {
        clientId: clientData.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: amount,
        planName: clientData.plan.name,
        period: paymentType === 'printing' ? 'Impresiones ' + new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : nextPaymentInfo.period,
        dueDate: nextPaymentInfo.dueDate,
        requestDate: new Date().toISOString(),
        status: 'pending',
        receiptImage: receiptBase64,
        paymentType: paymentType, // Agregar el tipo de pago
        description: description, // Agregar descripción detallada
        printRecords: includePrintRecords ? printRecords.map(record => record.id) : [], // Incluir IDs de impresiones si aplica
        printAmount: includePrintRecords ? calculatePendingPrintingTotal() : 0, // Monto de impresiones
        membershipAmount: paymentType !== 'printing' ? (clientData.plan as any).price || 0 : 0 // Monto de mensualidad
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
        description: "Tu solicitud de pago ha sido enviada al administrador para su revisión",
      })
      
      // Limpiar el formulario
      clearReceipt()
      setShowTransferModal(false)
      setPaymentType('membership')
      
      // Refrescar datos del cliente
      await refreshClientData()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de pago",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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

          {/* Impresiones Pendientes */}
          <Card className="p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Impresiones Pendientes</h3>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            
            {loadingPrintRecords ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : printRecords.length > 0 ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Hojas pendientes</span>
                    <span className="text-2xl font-bold text-orange-600">{calculatePendingPrintingSheets()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total a pagar</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ${calculatePendingPrintingTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {printRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="text-xs p-2 bg-orange-50 rounded">
                      <div className="flex justify-between">
                        <span>{record.sheets} hojas</span>
                        <span className="font-medium">${record.total_price.toFixed(2)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  ))}
                  {printRecords.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{printRecords.length - 3} impresiones más...
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setPaymentType('printing')
                    setShowTransferModal(true)
                  }}
                >
                  Pagar Impresiones
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">No tienes impresiones pendientes</p>
              </div>
            )}
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

              {printRecords.length > 0 && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setPaymentType('both')
                    setShowTransferModal(true)
                  }}
                >
                  Pagar Todo (${(((clientData?.plan as any)?.price || 0) + calculatePendingPrintingTotal()).toLocaleString('es-AR')})
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Modal de Pago Mejorado */}
        {showTransferModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-gray-300 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Opciones de Pago</h3>
              
              {/* Opciones de pago */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button
                  variant={paymentType === 'membership' ? 'default' : 'outline'}
                  onClick={() => setPaymentType('membership')}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm font-medium">Mensualidad</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${(clientData?.plan as any)?.price || 0}
                  </div>
                </Button>

                <Button
                  variant={paymentType === 'printing' ? 'default' : 'outline'}
                  onClick={() => setPaymentType('printing')}
                  className="flex flex-col items-center p-4 h-auto"
                  disabled={printRecords.length === 0}
                >
                  <div className="text-2xl mb-2">🖨️</div>
                  <div className="text-sm font-medium">Impresiones</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${calculatePendingPrintingTotal()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ({calculatePendingPrintingSheets()} hojas)
                  </div>
                </Button>

                <Button
                  variant={paymentType === 'both' ? 'default' : 'outline'}
                  onClick={() => setPaymentType('both')}
                  className="flex flex-col items-center p-4 h-auto"
                  disabled={printRecords.length === 0}
                >
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-sm font-medium">Todo Junto</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${((clientData?.plan as any)?.price || 0) + calculatePendingPrintingTotal()}
                  </div>
                </Button>
              </div>

              {/* Detalle del pago seleccionado */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-3">Detalle del pago:</h4>
                <div className="space-y-2">
                  {paymentType === 'membership' && (
                    <>
                      <div className="flex justify-between">
                        <span>Mensualidad - {clientData?.plan?.name}</span>
                        <span className="font-medium">${(clientData?.plan as any)?.price || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Período</span>
                        <span>{nextPaymentInfo.period}</span>
                      </div>
                    </>
                  )}

                  {paymentType === 'printing' && (
                    <>
                      <div className="flex justify-between">
                        <span>Impresiones pendientes</span>
                        <span className="font-medium">${calculatePendingPrintingTotal()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Cantidad de hojas</span>
                        <span>{calculatePendingPrintingSheets()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Período</span>
                        <span>Mes actual</span>
                      </div>
                    </>
                  )}

                  {paymentType === 'both' && (
                    <>
                      <div className="flex justify-between">
                        <span>Mensualidad - {clientData?.plan?.name}</span>
                        <span className="font-medium">${(clientData?.plan as any)?.price || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Impresiones pendientes</span>
                        <span className="font-medium">${calculatePendingPrintingTotal()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Período mensualidad</span>
                        <span>{nextPaymentInfo.period}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Período impresiones</span>
                        <span>Mes actual</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>TOTAL</span>
                          <span className="text-lg">${((clientData?.plan as any)?.price || 0) + calculatePendingPrintingTotal()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Datos bancarios */}
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
                    ${paymentType === 'membership' 
                      ? ((clientData?.plan as any)?.price || 0)
                      : paymentType === 'printing'
                      ? calculatePendingPrintingTotal()
                      : ((clientData?.plan as any)?.price || 0) + calculatePendingPrintingTotal()
                    }
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Referencia: {paymentType === 'printing' ? 'Impresiones ' : ''}{nextPaymentInfo.period}
                  </p>
                </div>

                {/* Campo de carga de comprobante */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-3">📸 Adjuntar comprobante de pago:</p>
                  
                  {!receiptPreview ? (
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="receipt"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="receipt"
                        className="cursor-pointer block"
                      >
                        <div className="text-green-600 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-green-700 font-medium">Hacer clic para subir comprobante</p>
                        <p className="text-xs text-green-600 mt-1">JPG, PNG - Máximo 5MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Vista previa del comprobante"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <button
                          onClick={clearReceipt}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-green-700 font-medium text-center">✅ Comprobante cargado</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowTransferModal(false)
                    clearReceipt()
                    setPaymentType('membership')
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCopyAlias}
                  disabled={uploading}
                >
                  Copiar Alias
                </Button>
              </div>

              <Button
                className="w-full mt-3 bg-green-600 hover:bg-green-700"
                onClick={handleMarkAsPaid}
                disabled={uploading || !receiptFile}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud con Comprobante'
                )}
              </Button>

              {!receiptFile && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  ⚠️ Debes adjuntar el comprobante para continuar
                </p>
              )}
            </div>
          </div>
        )}

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
