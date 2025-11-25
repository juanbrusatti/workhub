"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Settings, FileText, DollarSign, Users, CheckCircle } from "lucide-react"
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
  const { toast } = useToast()
  const { getIdToken } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      // Fetch all print records
      const recordsResponse = await fetch(`/api/admin/printing/records-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setPrintRecords(recordsData.records || [])
      }

      // Fetch printing settings
      const settingsResponse = await fetch(`/api/admin/printing/settings-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
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
  }

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

    if (price > 100) {
      toast({
        title: "Error",
        description: "El precio máximo por hoja es $100",
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

  // Calculate statistics
  const totalPending = printRecords
    .filter(r => r.status === "pending")
    .reduce((sum, r) => sum + r.total_price, 0)

  const totalPaid = printRecords
    .filter(r => r.status === "paid")
    .reduce((sum, r) => sum + r.total_price, 0)

  const totalSheetsPending = printRecords
    .filter(r => r.status === "pending")
    .reduce((sum, r) => sum + r.sheets, 0)

  const totalSheetsPaid = printRecords
    .filter(r => r.status === "paid")
    .reduce((sum, r) => sum + r.sheets, 0)

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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <p className="text-sm text-muted-foreground">Hojas pendientes</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalSheetsPending}</p>
        </Card>
        
        <Card className="p-6 border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-muted-foreground">Hojas pagadas</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalSheetsPaid}</p>
        </Card>
        
        <Card className="p-6 border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <p className="text-sm text-muted-foreground">Pendiente de cobro</p>
          </div>
          <p className="text-2xl font-bold text-red-600">${totalPending.toFixed(2)}</p>
        </Card>
        
        <Card className="p-6 border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-muted-foreground">Total cobrado</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">${totalPaid.toFixed(2)}</p>
        </Card>
      </div>

      {/* Settings */}
      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Precios
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="price">Precio por hoja ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Ej: 5.50"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              min="0.01"
              max="100"
              disabled={updatingSettings}
            />
          </div>
          <Button 
            onClick={handleUpdateSettings}
            disabled={updatingSettings || !newPrice}
            className="gap-2"
          >
            {updatingSettings ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar precio"
            )}
          </Button>
        </div>
        {settings.updatedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Última actualización: {format(new Date(settings.updatedAt), "dd/MM/yyyy HH:mm")}
          </p>
        )}
      </Card>

      {/* Print Records */}
      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Registros de Impresión
        </h3>
        
        {printRecords.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay registros de impresión</p>
          </div>
        ) : (
          <div className="space-y-3">
            {printRecords.map((record) => (
              <div 
                key={record.id} 
                className={`p-4 rounded-lg border ${
                  record.status === "paid" 
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20" 
                    : "bg-orange-50 border-orange-200 dark:bg-orange-950/20"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{record.client_name}</p>
                    <p className="text-sm text-muted-foreground">{record.client_email}</p>
                    <p className="text-sm">{record.sheets} hojas</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(record.date), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${record.total_price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}>
                        {record.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                      {record.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(record.id)}
                          disabled={markingPaid === record.id}
                          className="gap-1"
                        >
                          {markingPaid === record.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Marcar pagado
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
        )}
      </Card>
    </div>
  )
}
