"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, Info, Wrench, PartyPopper, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'maintenance' | 'event'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
  createdBy: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalAnnouncements: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function ClientAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { getIdToken } = useAuth()

  const fetchAnnouncements = async (page: number = 1) => {
    try {
      setLoading(true)
      const token = await getIdToken()

      if (!token) {
        console.error('❌ No se pudo obtener token')
        return
      }

      const response = await fetch(`/api/client/announcements?page=${page}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar anuncios')
      }

      const data = await response.json()
      setAnnouncements(data.announcements || [])
      setPagination(data.pagination || null)
      setCurrentPage(page)

    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'info':
        return { icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Información' }
      case 'maintenance':
        return { icon: Wrench, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Mantenimiento' }
      case 'event':
        return { icon: PartyPopper, color: 'bg-green-100 text-green-800 border-green-200', label: 'Evento' }
      default:
        return { icon: Info, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'General' }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Alta' }
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Media' }
      case 'low':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Baja' }
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Normal' }
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      fetchAnnouncements(newPage)
    }
  }

  if (loading && announcements.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Anuncios y Comunicaciones</h2>
        <p className="text-muted-foreground">
          Mantente informado sobre las últimas novedades de Ramos Generales
        </p>
      </div>

      {/* Anuncios */}
      <div className="space-y-4">
        {announcements.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay anuncios disponibles</p>
              <p className="text-sm">Muy pronto habrá nuevas comunicaciones para ti</p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const typeConfig = getTypeConfig(announcement.type)
            const priorityConfig = getPriorityConfig(announcement.priority)
            const TypeIcon = typeConfig.icon

            return (
              <Card key={announcement.id} className="p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(announcement.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                    <Badge variant="outline" className={priorityConfig.color}>
                      Prioridad: {priorityConfig.label}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {announcement.content}
                  </div>
                </div>

                {/* Priority Alert */}
                {announcement.priority === 'high' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Importante:</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Este anuncio requiere tu atención inmediata
                    </p>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Mostrando {announcements.length} de {pagination.totalAnnouncements} anuncios
            <br />
            Página {pagination.currentPage} de {pagination.totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay para paginación */}
      {loading && announcements.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
