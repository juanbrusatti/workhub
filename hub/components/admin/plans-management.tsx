"use client"

import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type BillingPeriod = "monthly" | "daily" | "hourly"

interface MembershipPlan {
  id: string
  name: string
  price: number
  billing_period: BillingPeriod
  capacity: number
  description: string | null
  created_at: string
}

interface PlanFormState {
  id?: string
  name: string
  price: string
  billingPeriod: BillingPeriod
  capacity: string
  description: string
}

const defaultFormState: PlanFormState = {
  name: "",
  price: "",
  billingPeriod: "monthly",
  capacity: "1",
  description: "",
}

export default function PlansManagement() {
  const { getIdToken } = useAuth()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState<PlanFormState>(defaultFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getIdToken()
      if (!token) throw new Error("missing-token")

      const response = await fetch("/api/admin/membership-plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron cargar los planes")
      }

      setPlans(payload.plans)
    } catch (err) {
      console.error(err)
      setError("No pudimos cargar los planes. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (field: keyof PlanFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const startCreate = () => {
    setEditingId(null)
    setFormState(defaultFormState)
  }

  const startEdit = (plan: MembershipPlan) => {
    setEditingId(plan.id)
    setFormState({
      id: plan.id,
      name: plan.name,
      price: plan.price.toString(),
      billingPeriod: plan.billing_period,
      capacity: plan.capacity.toString(),
      description: plan.description || "",
    })
  }

  const currentActionLabel = useMemo(() => (editingId ? "Guardar cambios" : "Crear plan"), [editingId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formState.name.trim()) {
      setError("El nombre es obligatorio")
      return
    }

    const price = Number(formState.price)
    const capacity = Number(formState.capacity)

    if (Number.isNaN(price) || price < 0) {
      setError("El precio debe ser un número válido")
      return
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("La cantidad de personas debe ser un entero mayor a 0")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = await getIdToken()
      if (!token) throw new Error("missing-token")

      const payload = {
        name: formState.name.trim(),
        price,
        billingPeriod: formState.billingPeriod,
        capacity,
        description: formState.description.trim() || null,
      }

      const response = await fetch(
        editingId ? `/api/admin/membership-plans/${editingId}` : "/api/admin/membership-plans",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar el plan")
      }

      if (editingId) {
        setPlans((prev) => prev.map((plan) => (plan.id === editingId ? data.plan : plan)))
      } else {
        setPlans((prev) => [data.plan, ...prev])
      }

      setFormState(defaultFormState)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setError("No pudimos guardar el plan. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este plan?")) return

    setDeletingId(id)
    setError(null)

    try {
      const token = await getIdToken()
      if (!token) throw new Error("missing-token")

      const response = await fetch(`/api/admin/membership-plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "No se pudo eliminar el plan")
      }

      setPlans((prev) => prev.filter((plan) => plan.id !== id))

      if (editingId === id) {
        setEditingId(null)
        setFormState(defaultFormState)
      }
    } catch (err) {
      console.error(err)
      setError("No pudimos eliminar el plan. Intenta nuevamente.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planes de membresía</h2>
        <p className="text-sm text-muted-foreground">
          Administra los planes disponibles para tus clientes. Toda la información visible se muestra en español.
        </p>
      </div>

      <Card className="p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {editingId ? "Editar plan" : "Crear nuevo plan"}
          </h3>
          <Button variant="outline" onClick={startCreate} disabled={saving}>
            Reiniciar formulario
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <Input
              value={formState.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Plan Ejecutivo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Precio</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de precio</label>
            <Select
              value={formState.billingPeriod}
              onValueChange={(value: BillingPeriod) => handleInputChange("billingPeriod", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="daily">Por día</SelectItem>
                <SelectItem value="hourly">Por hora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cantidad de personas</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={formState.capacity}
              onChange={(e) => handleInputChange("capacity", e.target.value)}
              placeholder="1"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <Textarea
              value={formState.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Incluye detalles o beneficios principales"
            />
          </div>

          {error && (
            <p className="md:col-span-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="md:col-span-2 flex gap-3 justify-end">
            {editingId && (
              <Button type="button" variant="outline" onClick={startCreate} disabled={saving}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : currentActionLabel}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando planes...</p>}
        {!loading && plans.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay planes registrados.</p>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-5 border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description || "Sin descripción"}</p>
                </div>
                <span className="text-sm font-semibold">{new Date(plan.created_at).toLocaleDateString()}</span>
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  <strong>Precio:</strong> ${plan.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
                <p>
                  <strong>Tipo:</strong> {plan.billing_period === "monthly" ? "Mensual" : plan.billing_period === "daily" ? "Por día" : "Por hora"}
                </p>
                <p>
                  <strong>Capacidad:</strong> {plan.capacity} {plan.capacity === 1 ? "persona" : "personas"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => startEdit(plan)} disabled={saving || deletingId === plan.id}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className={cn("flex-1", deletingId === plan.id && "opacity-70")}
                  onClick={() => handleDelete(plan.id)}
                  disabled={deletingId === plan.id || saving}
                >
                  {deletingId === plan.id ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
