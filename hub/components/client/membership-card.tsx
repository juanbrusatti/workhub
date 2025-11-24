import type { Client } from "@/lib/types"
import type { MembershipPlan } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface MembershipCardProps {
  plan: MembershipPlan
  client?: Client
}

export default function MembershipCard({ plan, client }: MembershipCardProps) {
  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{plan.name} Plan</h3>
          <p className="text-muted-foreground">{plan.description}</p>
        </div>
        <Badge className="bg-primary">{client?.status || "active"}</Badge>
      </div>

      <div className="mb-6">
        <p className="text-4xl font-bold">
          ${(plan as any).price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          <span className="text-lg text-muted-foreground">
            /{(plan as any).billing_period === 'monthly' ? 'mes' : (plan as any).billing_period === 'daily' ? 'día' : 'hora'}
          </span>
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <h4 className="font-semibold">Características incluidas:</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            WiFi libre
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            Capacidad para {(plan as any).capacity || 1} {(plan as any).capacity === 1 ? 'persona' : 'personas'}
          </li>
        </ul>
      </div>

      {client && (
        <div className="pt-6 border-t space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">
              {(plan as any).billing_period === 'monthly' 
                ? 'Período de pago' 
                : (plan as any).billing_period === 'daily' 
                  ? 'Período de renovación' 
                  : 'Período de uso'
              }
            </p>
            <p className="font-semibold">
              {(plan as any).billing_period === 'monthly' 
                ? 'Del 1 al 10 de cada mes' 
                : (plan as any).billing_period === 'daily' 
                  ? 'Se renueva cada día' 
                  : 'Se renueva cada hora'
              }
            </p>
          </div>
          <Link href="/client/payments">
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              Ver detalles de facturación
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
