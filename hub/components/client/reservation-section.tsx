"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface ReservationSectionProps {
  clientId: string
}

export default function ReservationSection({ clientId }: ReservationSectionProps) {
  const { user, getIdToken } = useAuth()
  const { toast } = useToast()
  
  const [type, setType] = useState<'yerba'|'broken'|'other'>('yerba')
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('low')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'El archivo debe ser una imagen', variant: 'destructive' })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'No autorizado', description: 'Debes iniciar sesión para enviar un reporte', variant: 'destructive' })
      return
    }
    if (!message.trim()) {
      toast({ title: 'Error', description: 'El mensaje no puede estar vacío', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const token = await getIdToken()
      const body: any = {
        clientId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type,
        priority,
        message,
      }

      if (imagePreview) body.image = imagePreview

      const res = await fetch('/api/client/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Error al enviar el reporte')

      toast({ title: 'Reporte enviado', description: 'El administrador ha sido notificado' })
      setType('yerba')
      setPriority('low')
      setMessage('')
      clearImage()
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'No se pudo enviar el reporte', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4">Reportar incidencia al administrador</h3>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de reporte</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background">
              <option value="yerba">insumos</option>
              <option value="broken">mantenimiento</option>
              <option value="other">Otro problema</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Foto (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Descripción del problema</label>
          <textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            className="w-full p-3 border rounded-md bg-background" 
            rows={5}
            placeholder="Describe el problema con el mayor detalle posible..."
          />
        </div>

        {imagePreview && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Vista previa:</p>
            <img src={imagePreview} alt="preview" className="w-48 h-48 object-cover rounded border" />
            <Button variant="outline" size="sm" onClick={clearImage} className="mt-2">
              Quitar imagen
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? '⏳ Enviando...' : '📤 Enviar Reporte'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
