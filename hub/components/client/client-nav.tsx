"use client"

import type { User } from "@/lib/types"
import { memo } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"
import Link from "next/link"

interface ClientNavProps {
  user: User
  onLogout: () => void
}

const ClientNav = memo(function ClientNav({ user, onLogout }: ClientNavProps) {
  return (
    <nav className="bg-card border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg hidden sm:inline">Ramos Generales</span>
          </div>
          
          {/* Navegación desktop - mantiene las opciones visibles */}
          <div className="hidden md:flex gap-4">
            <Link href="/client/dashboard" className="text-sm hover:text-primary">
              Panel
            </Link>
            <Link href="/client/payments" className="text-sm hover:text-primary">
              Facturación
            </Link>
          </div>

          {/* Menú General para móvil */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Menu className="h-4 w-4" />
                  <span>General</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/client/dashboard" className="w-full">
                    Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/payments" className="w-full">
                    Facturación
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Menú de usuario - solo visible en desktop */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm">{user.email}</DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
})

export default ClientNav
