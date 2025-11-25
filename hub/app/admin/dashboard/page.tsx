"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import AdminNav from "@/components/admin/admin-nav"
import DashboardOverview from "@/components/admin/dashboard-overview"
import ClientsManagement from "@/components/admin/clients-management"
import PlansManagement from "@/components/admin/plans-management"
import RoomsManagement from "@/components/admin/rooms-management"
import PrintingManagement from "@/components/admin/printing-management"
import AnnouncementsManagement from "@/components/admin/announcements-management"
import { useState } from "react"

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your coworking space</p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b">
          {[
            { id: "overview", label: "General" },
            { id: "clients", label: "Clientes" },
            { id: "plans", label: "Planes de pago" },
            { id: "rooms", label: "Salas y escritorios" },
            { id: "printing", label: "Impresiones" },
            { id: "announcements", label: "Anuncios" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <DashboardOverview />}
        {activeTab === "clients" && <ClientsManagement />}
        {activeTab === "plans" && <PlansManagement />}
        {activeTab === "rooms" && <RoomsManagement />}
        {activeTab === "printing" && <PrintingManagement />}
        {activeTab === "announcements" && <AnnouncementsManagement />}
      </main>
    </div>
  )
}
