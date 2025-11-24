"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

type AdminPlan = {
  id: string
  name: string
  price: number
  billing_period?: string | null
  billingPeriod?: string | null
  capacity?: number | null
  description?: string | null
  created_at?: string | null
}

type AdminClient = {
  id: string
  userId: string
  user: {
    id: string
    email: string
    name: string
    role: string
    companyName: string
    createdAt: Date
  }
  companyName: string
  planId?: string | null
  plan: AdminPlan | null
  subscriptionStartDate: Date
  subscriptionEndDate: Date | null
  status: "active" | "inactive" | "suspended"
  createdAt: Date
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClient, setNewClient] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    company: "", 
    plan: "" 
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { getIdToken } = useAuth()
  const { toast } = useToast()

  const fetchClients = async () => {
    try {
      const token = await getIdToken()
      if (!token) return

      const response = await fetch("/api/admin/clients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "No se pudieron cargar los clientes")
      }

      const payload = await response.json()
      const fetchedClients = Array.isArray(payload?.clients) ? payload.clients : []

      setClients(
        fetchedClients.map((client) => {
          const planData = client.plan
          const normalizedPlan: AdminPlan | null = planData
            ? {
                id: planData.id,
                name: planData.name,
                price: typeof planData.price === "number" ? planData.price : Number(planData.price) || 0,
                billing_period: planData.billing_period ?? planData.billingPeriod ?? null,
                billingPeriod: planData.billingPeriod ?? planData.billing_period ?? null,
                capacity: planData.capacity ?? null,
                description: planData.description ?? null,
                created_at: planData.created_at ?? null,
              }
            : null

          return {
            id: client.id,
            userId: client.userId,
            user: {
              ...client.user,
              createdAt: client.user?.createdAt ? new Date(client.user.createdAt) : new Date(),
            },
            companyName: client.companyName ?? "",
            planId: client.planId ?? client.plan?.id ?? null,
            plan: normalizedPlan,
            subscriptionStartDate: client.subscriptionStartDate
              ? new Date(client.subscriptionStartDate)
              : client.createdAt
              ? new Date(client.createdAt)
              : new Date(),
            subscriptionEndDate: client.subscriptionEndDate ? new Date(client.subscriptionEndDate) : null,
            status: client.status,
            createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
          }
        })
      )
    } catch (error) {
      console.error("Error fetching clients", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    }
  }

  // Cargar planes de pago al montar el componente
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true)
      try {
        const token = await getIdToken()
        if (!token) return

        const response = await fetch('/api/admin/membership-plans', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const payload = await response.json()
          const fetchedPlans = Array.isArray(payload?.plans)
            ? payload.plans
            : Array.isArray(payload)
              ? payload
              : []

          if (!Array.isArray(fetchedPlans)) {
            throw new Error('Formato inesperado de planes')
          }

          setPlans(fetchedPlans)

          if (fetchedPlans.length > 0) {
            setNewClient(prev => {
              const currentPlanExists = fetchedPlans.some(plan => plan.id === prev.plan)
              return { ...prev, plan: currentPlanExists ? prev.plan : fetchedPlans[0].id }
            })
          } else {
            setNewClient(prev => ({ ...prev, plan: "" }))
          }

          await fetchClients()
        } else {
          throw new Error('Error al cargar los planes de pago')
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes de pago",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()
  }, [getIdToken, toast])

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.password) {
      setFormError("Por favor completa todos los campos obligatorios")
      return
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newClient.email)) {
      setFormError("Por favor ingresa un correo electrónico válido")
      return
    }

    // Validación de contraseña
    if (newClient.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) {
        setFormError("Tu sesión expiró. Vuelve a iniciar sesión.")
        return
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newClient.email,
          password: newClient.password,
          name: newClient.name,
          companyName: newClient.company,
          planId: newClient.plan,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setFormError(payload.error || "No se pudo crear el cliente")
        return
      }

      // Obtener el plan seleccionado
      const selectedPlan = plans.find(plan => plan.id === newClient.plan)
      
      if (!selectedPlan) {
        throw new Error('No se pudo encontrar el plan seleccionado')
      }
      

      const newClientEntry = {
        id: payload.uid || payload.id,
        userId: payload.uid || payload.id,
        user: {
          id: payload.uid || payload.id,
          email: newClient.email,
          name: newClient.name,
          role: "client" as const,
          companyName: newClient.company || '',
          createdAt: new Date(),
        },
        companyName: newClient.company || '',
        plan: selectedPlan,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días después
        status: "active" as const,
        createdAt: new Date(),
      }

      setClients([newClientEntry, ...clients])
      setShowAddForm(false)
      // Resetear el formulario manteniendo el plan seleccionado
      setNewClient({ 
        name: "", 
        email: "", 
        password: "", 
        company: "", 
        plan: plans[0]?.id || "" 
      })
      
      toast({
        title: "Cliente creado",
        description: `El cliente ${newClient.name} ha sido creado exitosamente`,
      })
    } catch (error) {
      console.error(error)
      setFormError("Ocurrió un error inesperado al crear el cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (clientId: string, newStatus: "active" | "inactive" | "suspended") => {
    if (!clientId) {
      console.error('ID de cliente no proporcionado')
      return
    }

    // Guardar el estado anterior para poder revertir en caso de error
    const previousClients = [...clients]
    
    // Actualizar el estado local inmediatamente para mejor experiencia de usuario
    setClients(prevClients => 
      prevClients.map(c => 
        c.id === clientId ? { ...c, status: newStatus } : c
      )
    )

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación')
      }

      const response = await fetch(`/api/admin/clients/${clientId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar el estado')
      }

      await fetchClients()

      toast({
        title: '¡Listo!',
        description: 'Estado actualizado correctamente',
      })
    } catch (error) {
      console.error('Error actualizando estado:', error)
      // Revertir al estado anterior en caso de error
      setClients(previousClients)
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar el estado',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los clientes y sus suscripciones
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="gap-2"
          disabled={isLoading}
        >
          {showAddForm ? (
            <>
              <span>Cancelar</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6 border">
          <h3 className="text-lg font-bold mb-4">Nuevo Cliente</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del cliente <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Correo electrónico <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Contraseña temporal <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El cliente podrá cambiar su contraseña después de iniciar sesión
              </p>
            </div>
            
            <div>
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input
                id="company"
                type="text"
                placeholder="Nombre de la empresa"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Plan de pago <span className="text-destructive">*</span></Label>
              <Select
                value={newClient.plan}
                onValueChange={(value) => setNewClient({ ...newClient, plan: value })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} (${plan.price}/mes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {formError}
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddClient} 
                disabled={isSubmitting || !newClient.plan}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <span>Crear Cliente</span>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {clients.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No hay clientes</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Aún no has agregado ningún cliente. Haz clic en "Nuevo Cliente" para comenzar.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="p-6 border">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold">{client.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.user.email}</p>
                  <p className="text-sm font-medium mt-1">{client.companyName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Joined {format(client.createdAt, "MMM dd, yyyy")}</p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3">
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-primary">{client.plan?.name ?? "Sin plan"}</Badge>
                    <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
                  </div>

                  <select
                    value={client.status}
                    onChange={(e) => handleStatusChange(client.id, e.target.value as any)}
                    className="px-3 py-1 text-sm border rounded-md bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
