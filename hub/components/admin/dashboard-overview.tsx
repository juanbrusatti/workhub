"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"

type AdminClient = {
  id: string
  userId: string
  user: {
    id: string
    email: string
    name: string
    role: string
    companyName: string
    createdAt: string
  }
  companyName: string
  plan: {
    id: string
    name: string
    price: number
  } | null
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

type AdminRoom = {
  id: string
  name: string
  capacity: number
  desks: Array<{
    id: string
    name: string
    status: "available" | "reserved" | "occupied"
  }>
}

export default function DashboardOverview() {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showRevenue, setShowRevenue] = useState(true)
  const { getIdToken } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      // Fetch clients
      const clientsResponse = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData.clients || [])
      }

      setRooms([])

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate real statistics with memoization
  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "active").length
    const totalDesks = rooms.reduce((sum, room) => sum + room.desks.length, 0)
    const availableDesks = rooms.reduce(
      (sum, room) => sum + room.desks.filter((d) => d.status === "available").length,
      0,
    )
    const monthlyRevenue = clients
      .filter((c) => c.status === "active" && c.plan)
      .reduce((sum, c) => sum + (c.plan?.price || 0), 0)

    return [
      {
        label: "Clientes Activos",
        value: activeClients,
        color: "text-blue-600",
      },
      {
        label: "Total Escritorios",
        value: totalDesks || "N/A",
        color: "text-green-600",
      },
      {
        label: "Escritorios Disponibles",
        value: availableDesks || "N/A",
        color: "text-amber-600",
      },
      {
        label: "Ingresos Mensuales",
        value: showRevenue 
          ? (monthlyRevenue > 0 ? `$${monthlyRevenue.toLocaleString('es-AR')}` : "$0")
          : "••••••••",
        color: "text-purple-600",
        showToggle: true,
      },
    ]
  }, [clients, rooms, showRevenue])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 border">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.showToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRevenue(!showRevenue)}
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  {showRevenue ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay clientes registrados aún
            </p>
          ) : (
            clients.slice(0, 5).map((client) => (
              <div key={client.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded">
                <div>
                  <p className="font-semibold">{client.user.name}</p>
                  <p className="text-sm text-muted-foreground">{client.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{client.plan?.name || "Sin plan"}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.plan ? `$${client.plan.price}/mes` : "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
