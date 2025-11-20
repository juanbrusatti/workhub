"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import AdminNav from "@/components/admin/admin-nav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function AdminPaymentsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const allPayments = [
    {
      id: "1",
      clientName: "Alex Johnson",
      clientId: "client1",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      amount: 499,
      plan: "Professional",
      status: "completed" as const,
      transactionId: "TXN-2024-001",
    },
    {
      id: "2",
      clientName: "Sarah Design",
      clientId: "client2",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      amount: 199,
      plan: "Starter",
      status: "completed" as const,
      transactionId: "TXN-2024-002",
    },
    {
      id: "3",
      clientName: "Alex Johnson",
      clientId: "client1",
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      amount: 499,
      plan: "Professional",
      status: "completed" as const,
      transactionId: "TXN-2024-003",
    },
  ]

  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const completedPayments = allPayments.filter((p) => p.status === "completed").length

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground mt-2">Track all revenue and transactions</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6 border">
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-3xl font-bold">${totalRevenue}</p>
          </Card>
          <Card className="p-6 border">
            <p className="text-sm text-muted-foreground mb-2">Completed Payments</p>
            <p className="text-3xl font-bold">{completedPayments}</p>
          </Card>
          <Card className="p-6 border">
            <p className="text-sm text-muted-foreground mb-2">Average Payment</p>
            <p className="text-3xl font-bold">${(totalRevenue / completedPayments).toFixed(0)}</p>
          </Card>
        </div>

        <Card className="p-6 border">
          <h3 className="text-2xl font-bold mb-6">Payment Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Client</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">{format(payment.date, "MMM dd, yyyy")}</td>
                    <td className="py-3 font-medium">{payment.clientName}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3 font-bold">${payment.amount}</td>
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
