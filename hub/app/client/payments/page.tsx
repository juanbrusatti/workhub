"use client"

import { useAuth } from "@/lib/auth-context"
import { useNotification } from "@/lib/notification-context"
import { mockClients, mockMembershipPlans } from "@/lib/mock-data"
import ClientNav from "@/components/client/client-nav"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { format } from "date-fns"

export default function PaymentsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { addNotification } = useNotification()
  const [paymentHistory, setPaymentHistory] = useState([
    {
      id: "1",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      amount: 499,
      plan: "Professional",
      status: "completed" as const,
      transactionId: "TXN-2024-001",
    },
    {
      id: "2",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      amount: 499,
      plan: "Professional",
      status: "completed" as const,
      transactionId: "TXN-2024-002",
    },
  ])

  if (!user) return null

  const clientData = mockClients.find((c) => c.userId === user.id)
  const plan = clientData?.plan || mockMembershipPlans[0]

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleUpgradePlan = (newPlanId: string) => {
    const newPlan = mockMembershipPlans.find((p) => p.id === newPlanId)
    if (newPlan) {
      addNotification(`Upgraded to ${newPlan.name} plan!`, "success")
    }
  }

  const handleRenewSubscription = () => {
    const newPayment = {
      id: Math.random().toString(),
      date: new Date(),
      amount: plan.price,
      plan: plan.name,
      status: "completed" as const,
      transactionId: `TXN-${Date.now()}`,
    }
    setPaymentHistory([newPayment, ...paymentHistory])
    addNotification("Subscription renewed successfully!", "success")
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNav user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription and payment history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Current Subscription */}
          <Card className="p-6 border-2 border-primary/20">
            <h3 className="text-xl font-bold mb-4">Current Subscription</h3>
            <div className="mb-6">
              <Badge className="bg-primary mb-2">{clientData?.status}</Badge>
              <p className="text-3xl font-bold">{plan.name}</p>
              <p className="text-2xl font-bold text-primary mt-2">${plan.price}/month</p>
            </div>

            <div className="space-y-2 mb-6 p-3 bg-secondary/50 rounded">
              <p className="text-sm">
                <strong>Renewal Date:</strong> {format(clientData?.subscriptionEndDate || new Date(), "MMM dd, yyyy")}
              </p>
              <p className="text-sm">
                <strong>Billing Cycle:</strong> {plan.billingCycle}
              </p>
              <p className="text-sm">
                <strong>Max Desks:</strong> {plan.maxDesks}
              </p>
            </div>

            <Button onClick={handleRenewSubscription} className="w-full mb-2">
              Renew Subscription
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push("/client/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Card>

          {/* Upgrade Options */}
          <Card className="p-6 border">
            <h3 className="text-xl font-bold mb-4">Upgrade Plan</h3>
            <div className="space-y-3">
              {mockMembershipPlans
                .filter((p) => p.price > plan.price)
                .map((upgradePlan) => (
                  <div key={upgradePlan.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">{upgradePlan.name}</p>
                      <p className="font-bold text-lg">${upgradePlan.price}/mo</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{upgradePlan.maxDesks} desks included</p>
                    <Button size="sm" onClick={() => handleUpgradePlan(upgradePlan.id)} className="w-full">
                      Upgrade
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="p-6 border">
          <h3 className="text-2xl font-bold mb-6">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3">{format(payment.date, "MMM dd, yyyy")}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3 font-semibold">${payment.amount}</td>
                    <td className="py-3">
                      <Badge className="bg-green-600">{payment.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground text-xs font-mono">{payment.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
