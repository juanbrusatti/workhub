"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Plus, TrendingUp, FileText } from "lucide-react"

type PrintingSettings = {
  pricePerSheet: number
}

export default function QuickPrintAction({ onViewDetails }: { onViewDetails: () => void }) {
  const [sheets, setSheets] = useState("")
  const [settings, setSettings] = useState<PrintingSettings>({ pricePerSheet: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { getIdToken } = useAuth()

  const totalCost = sheets ? parseFloat(sheets) * settings.pricePerSheet : 0

  const fetchSettings = async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      const response = await fetch(`/api/client/printing/settings-supabase`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const settingsData = await response.json()
        setSettings(settingsData)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSubmit = async () => {
    const sheetsNum = parseInt(sheets)
    
    if (!sheets || sheetsNum <= 0 || sheetsNum > 100) {
      toast({
        title: "Error",
        description: "Por favor ingresa un número válido de hojas (1-100)",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) return

      const response = await fetch(`/api/client/printing/records-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sheets: sheetsNum
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar impresión')
      }

      toast({
        title: "¡Impresión registrada!",
        description: `Se han registrado ${sheetsNum} hojas por $${totalCost.toFixed(2)}`,
      })

      setSheets("")

    } catch (error) {
      console.error("Error registering print:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la impresión",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Carga Rápida de Hojas</h3>
            <p className="text-sm text-gray-600">Registra tus impresiones al instante</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver detalles
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-sheets" className="text-gray-700 text-sm font-medium">Cantidad de hojas</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="quick-sheets"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ingrese cantidad..."
                  value={sheets}
                  onChange={(e) => setSheets(e.target.value)}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !sheets}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cargar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Precio por hoja:</span>
                <span className="font-bold text-blue-600">${settings.pricePerSheet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Total a pagar:</span>
                <span className="text-xl font-bold text-gray-800">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {sheets ? `${sheets} hojas` : "0 hojas"}
            </div>
            <p className="text-sm text-gray-600">
              {sheets ? `Listo para cargar` : "Ingresa la cantidad"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
