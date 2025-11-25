"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Plus, Printer, FileText, CheckCircle } from "lucide-react"
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
}

export default function PrintingSection({ clientId }: { clientId: string }) {
  const [printRecords, setPrintRecords] = useState<PrintRecord[]>([])
  const [settings, setSettings] = useState<PrintingSettings>({ pricePerSheet: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sheets, setSheets] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all")
  const recordsPerPage = 5
  const { toast } = useToast()
  const { getIdToken, user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [clientId])

  const fetchData = async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      // Usar el ID del usuario directamente para asegurar consistencia
      const userUid = user?.id
      console.log("Obteniendo datos de impresión para user ID:", userUid, "clientId recibido:", clientId)

      // Fetch print records
      const recordsResponse = await fetch(`/api/client/printing/records-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log("Respuesta de records:", recordsResponse.status)
      
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        console.log("Datos de registros obtenidos:", recordsData)
        setPrintRecords(recordsData.records || [])
      } else {
        const errorData = await recordsResponse.json()
        console.error("Error en records:", errorData)
        console.error("Status:", recordsResponse.status)
        console.error("Headers:", Object.fromEntries(recordsResponse.headers.entries()))
      }

      // Fetch printing settings
      const settingsResponse = await fetch(`/api/client/printing/settings-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        console.log("Configuración obtenida:", settingsData)
        setSettings(settingsData)
      }

    } catch (error) {
      console.error("Error fetching printing data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrintRecord = async () => {
    const sheetsNum = parseInt(sheets)
    
    if (!sheets || sheetsNum <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número válido de hojas",
        variant: "destructive"
      })
      return
    }

    if (sheetsNum > 100) {
      toast({
        title: "Error", 
        description: "El número máximo de hojas por registro es 100",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const userUid = user?.id
      console.log("Enviando registro de impresión:", { sheets: sheetsNum, userUid, clientId })

      const response = await fetch('/api/client/printing/records-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sheets: sheetsNum })
      })

      const data = await response.json()
      console.log("Respuesta del servidor:", data)

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar impresión')
      }

      setSheets("")
      
      toast({
        title: "Impresión registrada",
        description: `Se registraron ${sheetsNum} hojas correctamente`,
      })

      // Refresh data to get the updated list
      await fetchData()

    } catch (error) {
      console.error("Error adding print record:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la impresión",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate statistics
  const totalPending = printRecords
    .filter(r => r.status === "pending")
    .reduce((sum, r) => sum + r.total_price, 0)

  const totalSheets = printRecords
    .reduce((sum, r) => sum + r.sheets, 0)

  // Filter records based on status
  const filteredRecords = printRecords.filter(record => {
    if (statusFilter === "all") return true
    return record.status === statusFilter
  })

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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-orange-500 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Impresiones Pendientes</p>
              <p className="text-2xl font-bold">{printRecords.filter(r => r.status === "pending").length}</p>
              <p className="text-xs opacity-75">Total: ${totalPending.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-500 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Impresiones Pagadas</p>
              <p className="text-2xl font-bold">{printRecords.filter(r => r.status === "paid").length}</p>
              <p className="text-xs opacity-75">Completadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-500 text-white">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            <div>
              <p className="text-sm opacity-90">Total de Hojas</p>
              <p className="text-2xl font-bold">{totalSheets}</p>
              <p className="text-xs opacity-75">Registradas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Print Record */}
      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Registrar Impresión
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="sheets">Número de hojas</Label>
            <Input
              id="sheets"
              type="number"
              placeholder="Ej: 10"
              value={sheets}
              onChange={(e) => setSheets(e.target.value)}
              min="1"
              max="100"
              disabled={submitting}
            />
          </div>
          <Button 
            onClick={handleAddPrintRecord}
            disabled={submitting || !sheets}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                Registrar
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          El registro se creará automáticamente con tu nombre y la fecha actual
        </p>
      </Card>

      {/* Print Records Section */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Historial de Impresiones</h2>
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
            <p className="text-sm text-muted-foreground mt-2">
              Usa el formulario de arriba para registrar tu primera impresión
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
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{record.sheets} hojas</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.date), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${record.total_price.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === "paid"
                          ? "bg-green-500 text-white"
                          : "bg-orange-500 text-white"
                      }`}>
                        {record.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
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
