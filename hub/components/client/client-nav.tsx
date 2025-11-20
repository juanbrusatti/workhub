"use client"

import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface ClientNavProps {
  user: User
  onLogout: () => void
}

export default function ClientNav({ user, onLogout }: ClientNavProps) {
  return (
    <nav className="bg-card border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <span className="font-bold text-lg hidden sm:inline">CoWorkHub</span>
          </div>
          <div className="hidden md:flex gap-4">
            <Link href="/client/dashboard" className="text-sm hover:text-primary">
              Dashboard
            </Link>
            <Link href="/client/payments" className="text-sm hover:text-primary">
              Billing
            </Link>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-sm">{user.email}</DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
