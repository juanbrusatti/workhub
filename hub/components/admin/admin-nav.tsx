"use client"

import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface AdminNavProps {
  user: User
  onLogout: () => void
}

export default function AdminNav({ user, onLogout }: AdminNavProps) {
  return (
    <nav className="bg-card border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center text-destructive-foreground font-bold text-lg">
              A
            </div>
            <span className="font-bold text-lg hidden sm:inline">CoWorkHub Admin</span>
          </div>
          <div className="hidden md:flex gap-4">
            <Link href="/admin/dashboard" className="text-sm hover:text-primary">
              Dashboard
            </Link>
            <Link href="/admin/payments" className="text-sm hover:text-primary">
              Payments
            </Link>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-sm font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-sm">{user.email}</DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-muted-foreground">Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
