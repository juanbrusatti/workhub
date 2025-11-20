"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockClients } from "@/lib/mock-data"
import { useState } from "react"
import { format } from "date-fns"

export default function ClientsManagement() {
  const [clients, setClients] = useState(mockClients)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newClient, setNewClient] = useState({ name: "", email: "", company: "", plan: "1" })

  const handleAddClient = () => {
    if (newClient.name && newClient.email && newClient.company) {
      // Mock add client
      setShowAddForm(false)
      setNewClient({ name: "", email: "", company: "", plan: "1" })
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
              Create Client
            </Button>
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
