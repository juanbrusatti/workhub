"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Settings, FileText, DollarSign, Users, CheckCircle, Printer } from "lucide-react"
import { format } from "date-fns"

type PrintRecord = {
  id: string
  client_id: string
  client_name: string
  client_email: string
  sheets: number
  date: string
  created_at: string
  price_per_sheet: number
  total_price: number
  status: "pending" | "paid"
}

type PrintingSettings = {
  pricePerSheet: number
  updatedAt: string
}

export default function PrintingManagement() {
  const [printRecords, setPrintRecords] = useState<PrintRecord[]>([])
  const [settings, setSettings] = useState<PrintingSettings>({ pricePerSheet: 0, updatedAt: "" })
  const [newPrice, setNewPrice] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingSettings, setUpdatingSettings] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all")
  const recordsPerPage = 5
  const { toast } = useToast()
  const { getIdToken } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      // Fetch both in parallel
      const [recordsResponse, settingsResponse] = await Promise.all([
        fetch(`/api/admin/printing/records-supabase`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/printing/settings-supabase`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setPrintRecords(recordsData.records || [])
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings({
          pricePerSheet: settingsData.price_per_sheet,
          updatedAt: settingsData.updated_at
        })
        setNewPrice(settingsData.price_per_sheet.toString())
      }

    } catch (error) {
      console.error("Error fetching printing data:", error)
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  const handleUpdateSettings = async () => {
    const price = parseFloat(newPrice)
    
    if (!newPrice || price <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un precio válido mayor a 0",
        variant: "destructive"
      })
      return
    }

    if (price > 1000) {
      toast({
        title: "Error",
        description: "El precio máximo por hoja es $1000",
        variant: "destructive"
      })
      return
    }

    setUpdatingSettings(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const response = await fetch('/api/admin/printing/settings-supabase', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pricePerSheet: price })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar configuración')
      }

      setSettings(prev => ({ 
        ...prev, 
        pricePerSheet: price, 
        updatedAt: new Date().toISOString() 
      }))
      
      toast({
        title: "Configuración actualizada",
        description: `El precio por hoja se ha actualizado a $${price}`,
      })

    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la configuración",
        variant: "destructive"
      })
    } finally {
      setUpdatingSettings(false)
    }
  }

  const handleMarkAsPaid = async (recordId: string) => {
    setMarkingPaid(recordId)

    try {
      const token = await getIdToken()
      if (!token) return

      const response = await fetch(`/api/admin/printing/records-supabase/${recordId}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al marcar como pagado')
      }

      setPrintRecords(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, status: "paid" as const }
            : record
        )
      )
      
      toast({
        title: "Registro marcado como pagado",
        description: "El registro de impresión ha sido marcado como pagado correctamente",
      })

    } catch (error) {
      console.error("Error marking as paid:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo marcar como pagado",
        variant: "destructive"
      })
    } finally {
      setMarkingPaid(null)
    }
  }

  // Memoize statistics
  const stats = useMemo(() => {
    const pending = printRecords.filter(r => r.status === "pending")
    const paid = printRecords.filter(r => r.status === "paid")
    
    return {
      totalPending: pending.reduce((sum, r) => sum + r.total_price, 0),
      totalPaid: paid.reduce((sum, r) => sum + r.total_price, 0),
      totalSheetsPending: pending.reduce((sum, r) => sum + r.sheets, 0),
      totalSheetsPaid: paid.reduce((sum, r) => sum + r.sheets, 0),
      pendingCount: pending.length,
      paidCount: paid.length
    }
  }, [printRecords])

  // Filter records based on status
  const filteredRecords = useMemo(() => {
    if (statusFilter === "all") return printRecords
    return printRecords.filter(record => record.status === statusFilter)
  }, [printRecords, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const currentRecords = filteredRecords.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando datos de impresión...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Printer className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestión de Impresiones</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-500 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Total Pendientes</p>
              <p className="text-2xl font-bold">
                ${stats.totalPending.toFixed(2)}
              </p>
              <p className="text-xs opacity-75">
                {stats.totalSheetsPending} hojas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-500 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Total Pagados</p>
              <p className="text-2xl font-bold">
                ${stats.totalPaid.toFixed(2)}
              </p>
              <p className="text-xs opacity-75">
                {stats.totalSheetsPaid} hojas
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-500 text-white">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Registros Pendientes</p>
              <p className="text-2xl font-bold">
                {stats.pendingCount}
              </p>
              <p className="text-xs opacity-75">
                Por procesar
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-500 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Registros Pagados</p>
              <p className="text-2xl font-bold">
                {stats.paidCount}
              </p>
              <p className="text-xs opacity-75">
                Completados
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Configuración de Precios</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="pricePerSheet">Precio por hoja</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="pricePerSheet"
                type="number"
                step="0.01"
                min="1"
                max="1000"
                placeholder="0.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateSettings}
                disabled={updatingSettings || !newPrice}
                className="gap-1"
              >
                {updatingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
            {settings.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Última actualización: {format(new Date(settings.updatedAt), "dd/MM/yyyy HH:mm")}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Records Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Registros de Impresión</h2>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar:</span>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                Todos ({printRecords.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
              >
                Pendientes ({printRecords.filter(r => r.status === "pending").length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "paid" ? "default" : "outline"}
                onClick={() => setStatusFilter("paid")}
              >
                Pagados ({printRecords.filter(r => r.status === "paid").length})
              </Button>
            </div>
          </div>
        </div>

        {currentRecords.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "No hay registros de impresión" 
                : `No hay registros ${statusFilter === "pending" ? "pendientes" : "pagados"}`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentRecords.map((record) => (
                <div 
                  key={record.id} 
                  className={`p-4 rounded-lg border ${
                    record.status === "paid" 
                      ? "bg-green-100 border-green-500" 
                      : "bg-orange-100 border-orange-500"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{record.client_name}</p>
                      <p className="text-sm text-muted-foreground">{record.client_email}</p>
                      <p className="text-sm">{record.sheets} hojas</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right sm:min-w-0">
                      <p className="font-semibold">
                        ${record.total_price.toFixed(2)}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <span className={`text-xs text-center px-2 py-1 rounded-full ${
                          record.status === "paid"
                            ? "bg-green-500 text-white"
                            : "bg-orange-500 text-white"
                        }`}>
                          {record.status === "paid" ? "Pagado" : "Pendiente"}
                        </span>
                        {record.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsPaid(record.id)}
                            disabled={markingPaid === record.id}
                            className="gap-1 flex-shrink-0"
                          >
                            {markingPaid === record.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="hidden sm:inline">Procesando...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">Marcar como pagado</span>
                                <span className="sm:hidden">Marcar como pagado</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredRecords.length)} de {filteredRecords.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
