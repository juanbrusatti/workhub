"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockMembershipPlans } from "@/lib/mock-data"
import { useState } from "react"

export default function PlansManagement() {
  const [plans, setPlans] = useState(mockMembershipPlans)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>(null)

  const handleEditStart = (plan: any) => {
    setEditingId(plan.id)
    setFormData({ ...plan })
  }

  const handleEditSave = () => {
    setPlans(plans.map((p) => (p.id === editingId ? formData : p)))
    setEditingId(null)
    setFormData(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6 border">
            {editingId === plan.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm bg-background"
                />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm bg-background"
                />
                <input
                  type="number"
                  value={formData.maxDesks}
                  onChange={(e) => setFormData({ ...formData, maxDesks: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm bg-background"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEditSave} className="flex-1">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-sm text-muted-foreground">/mo</span>
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <strong>Desks:</strong> {plan.maxDesks}
                  </p>
                  <p className="text-sm">
                    <strong>Cycle:</strong> {plan.billingCycle}
                  </p>
                </div>
                <div className="space-y-1 mb-4">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {f}
                    </p>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditStart(plan)} className="w-full">
                  Edit Plan
                </Button>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
