"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockClients, mockMembershipPlans } from "@/lib/mock-data"
import { useState } from "react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"

export default function ClientsManagement() {
  const [clients, setClients] = useState(mockClients)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClient, setNewClient] = useState({ name: "", email: "", password: "", company: "", plan: "1" })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { getIdToken } = useAuth()

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.password) {
      setFormError("Please complete all required fields")
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      const token = await getIdToken()
      if (!token) {
        setFormError("Your session expired. Please sign in again.")
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
        setFormError(payload.error || "Failed to create client")
        return
      }

      const selectedPlan =
        mockMembershipPlans.find((plan) => plan.id === newClient.plan) || mockMembershipPlans[0]

      const newClientEntry = {
        id: payload.id,
        userId: payload.id,
        user: {
          id: payload.id,
          email: newClient.email,
          name: newClient.name,
          role: "client" as const,
          companyName: newClient.company,
          createdAt: new Date(),
        },
        companyName: newClient.company,
        plan: selectedPlan,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(),
        status: "active" as const,
        createdAt: new Date(),
      }

      setClients([newClientEntry, ...clients])
      setShowAddForm(false)
      setNewClient({ name: "", email: "", password: "", company: "", plan: "1" })
    } catch (error) {
      console.error(error)
      setFormError("Unexpected error while creating client")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = (clientId: string, newStatus: "active" | "inactive" | "suspended") => {
    setClients(clients.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c)))
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
        {showAddForm ? "Cancel" : "+ Add New Client"}
      </Button>

      {showAddForm && (
        <Card className="p-6 border">
          <h3 className="text-lg font-bold mb-4">Create New Client</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="Temporary password"
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                placeholder="Company Inc"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Membership Plan</label>
              <select
                value={newClient.plan}
                onChange={(e) => setNewClient({ ...newClient, plan: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="1">Starter ($199/mo)</option>
                <option value="2">Professional ($499/mo)</option>
                <option value="3">Enterprise ($1,299/mo)</option>
              </select>
            </div>
            <Button onClick={handleAddClient} className="w-full">
              {isSubmitting ? "Creating..." : "Create Client"}
            </Button>
            {formError && <p className="text-sm text-destructive text-center">{formError}</p>}
          </div>
        </Card>
      )}

      <div className="space-y-3">
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
                  <Badge className="bg-primary">{client.plan.name}</Badge>
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
    </div>
  )
}
