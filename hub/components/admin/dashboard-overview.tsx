import { Card } from "@/components/ui/card"
import { mockClients, mockRooms } from "@/lib/mock-data"

export default function DashboardOverview() {
  const activeClients = mockClients.filter((c) => c.status === "active").length
  const totalDesks = mockRooms.reduce((sum, room) => sum + room.desks.length, 0)
  const availableDesks = mockRooms.reduce(
    (sum, room) => sum + room.desks.filter((d) => d.status === "available").length,
    0,
  )
  const revenue = mockClients.filter((c) => c.status === "active").reduce((sum, c) => sum + c.plan.price, 0)

  const stats = [
    {
      label: "Active Clients",
      value: activeClients,
      color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Desks",
      value: totalDesks,
      color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    },
    {
      label: "Available Desks",
      value: availableDesks,
      color: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Monthly Revenue",
      value: `$${revenue}`,
      color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 border">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {mockClients.slice(0, 5).map((client) => (
            <div key={client.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded">
              <div>
                <p className="font-semibold">{client.user.name}</p>
                <p className="text-sm text-muted-foreground">{client.companyName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{client.plan.name}</p>
                <p className="text-sm text-muted-foreground">${client.plan.price}/mo</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
