"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Send, Trash2, AlertCircle, Info, Wrench, PartyPopper } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'maintenance' | 'event'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  createdBy: string
  active: boolean
}

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const { toast } = useToast()
  const { getIdToken } = useAuth()
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "info" as const,
    priority: "medium" as const,
  })

  // Cargar anuncios existentes
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    try {
      setFetchLoading(true)
      const token = await getIdToken()
      
      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        })
        return
      }
      
      const response = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los anuncios: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setFetchLoading(false)
    }
  }, [getIdToken, toast])

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: "Error",
        description: "El título y el contenido son obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const token = await getIdToken()

      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement)
      })

      if (!response.ok) {
        throw new Error('Error al crear anuncio')
      }

      const data = await response.json()
      
      // Agregar el nuevo anuncio a la lista
      const createdAnnouncement = {
        id: data.announcementId,
        ...data.announcement,
        createdAt: new Date(data.announcement.createdAt)
      }
      setAnnouncements([createdAnnouncement, ...announcements])

      // Resetear formulario
      setNewAnnouncement({ title: "", content: "", type: "info", priority: "medium" })
      setShowForm(false)

      // Mostrar éxito con estadísticas de email
      toast({
        title: "✅ Anuncio creado exitosamente",
        description: `Enviados ${data.emailStats.successful} de ${data.emailStats.total} emails`,
        duration: 5000
      })

    } catch (error) {
      console.error('Error creating announcement:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el anuncio",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const token = await getIdToken()

      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ announcementId: id })
      })

      if (!response.ok) {
        throw new Error('Error al eliminar anuncio')
      }

      // Eliminar de la lista
      setAnnouncements(announcements.filter(a => a.id !== id))

      toast({
        title: "Anuncio eliminado",
        description: "El anuncio ha sido eliminado exitosamente"
      })

    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el anuncio",
        variant: "destructive"
      })
    }
  }

  // Configuración de tipos y prioridades
  const typeConfig = {
    info: { icon: Info, color: 'blue', label: 'Información' },
    maintenance: { icon: Wrench, color: 'orange', label: 'Mantenimiento' },
    event: { icon: PartyPopper, color: 'green', label: 'Evento' }
  }

  const priorityConfig = {
    low: { color: 'gray', label: 'Baja' },
    medium: { color: 'yellow', label: 'Media' },
    high: { color: 'red', label: 'Alta' }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando anuncios...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Anuncios</h2>
          <p className="text-muted-foreground">Crea y gestiona comunicaciones para todos los clientes</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className="gap-2"
          size={showForm ? "outline" : "default"}
        >
          {showForm ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Cancelar
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Nuevo Anuncio
            </>
          )}
        </Button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <Card className="p-6 border-2 border-primary/20">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Crear Nuevo Anuncio
          </h3>
          
          <div className="space-y-6">
            {/* Título */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Título del Anuncio *</Label>
              <Input
                id="title"
                placeholder="Ej: Mantenimiento programado del sistema"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Contenido */}
            <div>
              <Label htmlFor="content" className="text-sm font-medium">Contenido del Anuncio *</Label>
              <Textarea
                id="content"
                placeholder="Escribe el mensaje completo para los clientes..."
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                className="mt-2 min-h-32"
              />
            </div>

            {/* Tipo y Prioridad */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Tipo de Anuncio</Label>
                <Select
                  value={newAnnouncement.type}
                  onValueChange={(value: 'info' | 'maintenance' | 'event') => 
                    setNewAnnouncement({ ...newAnnouncement, type: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Información
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-orange-500" />
                        Mantenimiento
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="w-4 h-4 text-green-500" />
                        Evento
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Prioridad</Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón de creación */}
            <Button 
              onClick={handleCreateAnnouncement} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando y enviando emails...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Crear Anuncio y Enviar a Todos los Clientes
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de anuncios */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay anuncios</h3>
            <p className="text-muted-foreground">Crea tu primer anuncio para comunicarte con los clientes</p>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const TypeIcon = typeConfig[announcement.type].icon
            const typeInfo = typeConfig[announcement.type]
            const priorityInfo = priorityConfig[announcement.priority]

            return (
              <Card key={announcement.id} className="p-6 border-l-4" 
                    style={{ borderLeftColor: typeInfo.color === 'blue' ? '#3b82f6' : 
                                                  typeInfo.color === 'orange' ? '#f59e0b' : '#10b981' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${typeInfo.color === 'blue' ? 'bg-blue-100' : 
                          typeInfo.color === 'orange' ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <TypeIcon className={`w-5 h-5 
                          ${typeInfo.color === 'blue' ? 'text-blue-600' : 
                            typeInfo.color === 'orange' ? 'text-orange-600' : 'text-green-600'}`} />
                      </div>
                      <h3 className="text-lg font-bold">{announcement.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(announcement.createdAt, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                      {typeInfo.label}
                    </Badge>
                    <Badge variant="outline">
                      Prioridad {priorityInfo.label}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="text-destructive hover:bg-destructive hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Anuncio
                </Button>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
