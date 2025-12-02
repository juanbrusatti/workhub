"use client"

import { useAuth } from "@/lib/auth-context"
import AdminNav from "@/components/admin/admin-nav"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

interface Report {
  id: string
  clientId: string
  userId: string
  userName: string
  userEmail: string
  type: 'yerba' | 'broken' | 'other'
  priority: 'low' | 'medium' | 'high'
  message: string
  image?: string
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
  updatedAt: string
}

export default function ReportsPage() {
  const { user, getIdToken, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      const res = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Error al cargar reportes')
      const data = await res.json()
      setReports(data.reports || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    setUpdatingId(reportId)
    try {
      const token = await getIdToken()
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportId, status: newStatus })
      })

      if (!res.ok) throw new Error('Error al actualizar reporte')
      
      setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r))
      toast({ title: 'Éxito', description: 'Reporte actualizado correctamente' })
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo actualizar el reporte', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(r => r.status === filterStatus)

  const typeConfig = {
    yerba: { emoji: '🌿', label: 'Falta de insumos' },
    broken: { emoji: '🔧', label: 'Mantenimiento' },
    other: { emoji: '⚠️', label: 'Otro problema' }
  }

  const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'En progreso', color: 'bg-blue-100 text-blue-800' },
    resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800' }
  }

  const priorityConfig = {
    low: { label: 'Baja', color: '#6b7280' },
    medium: { label: 'Media', color: '#f59e0b' },
    high: { label: 'Alta', color: '#ef4444' }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Reportes de Clientes</h1>
          <p className="text-muted-foreground mt-2">Gestiona los reportes de incidencias de los clientes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            Todos ({reports.length})
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
          >
            Pendientes ({reports.filter(r => r.status === 'pending').length})
          </Button>
          <Button 
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('in_progress')}
          >
            En Progreso ({reports.filter(r => r.status === 'in_progress').length})
          </Button>
          <Button 
            variant={filterStatus === 'resolved' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('resolved')}
          >
            Resueltos ({reports.filter(r => r.status === 'resolved').length})
          </Button>
        </div>

        {filteredReports.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No hay reportes en esta categoría</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const typeInfo = typeConfig[report.type]
              const statusInfo = statusConfig[report.status]
              const priorityInfo = priorityConfig[report.priority]

              return (
                <Card key={report.id} className="p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{typeInfo.emoji}</span>
                        <h3 className="text-xl font-bold">{typeInfo.label}</h3>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        <Badge style={{ backgroundColor: priorityInfo.color }}>{priorityInfo.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Cliente:</strong> {report.userName} ({report.userEmail})</p>
                        <p><strong>Fecha:</strong> {new Date(report.createdAt).toLocaleString('es-AR')}</p>
                        <p><strong>ID:</strong> {report.id}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    >
                      {selectedReport?.id === report.id ? 'Ocultar' : 'Ver más'}
                    </Button>
                  </div>

                  {selectedReport?.id === report.id && (
                    <div className="bg-secondary/50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-3">📝 Mensaje del cliente:</h4>
                      <p className="text-sm whitespace-pre-wrap mb-4">{report.message}</p>

                      {report.image && (
                        <div>
                          <h4 className="font-semibold mb-2">📸 Imagen adjunta:</h4>
                          <img 
                            src={report.image} 
                            alt="Reporte" 
                            className="max-w-sm max-h-96 rounded border" 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    {report.status !== 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(report.id, 'pending')}
                        disabled={updatingId === report.id}
                      >
                        {updatingId === report.id ? '...' : 'Pendiente'}
                      </Button>
                    )}
                    {report.status !== 'in_progress' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(report.id, 'in_progress')}
                        disabled={updatingId === report.id}
                      >
                        {updatingId === report.id ? '...' : 'En Progreso'}
                      </Button>
                    )}
                    {report.status !== 'resolved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(report.id, 'resolved')}
                        disabled={updatingId === report.id}
                      >
                        {updatingId === report.id ? '...' : 'Resuelto'}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
