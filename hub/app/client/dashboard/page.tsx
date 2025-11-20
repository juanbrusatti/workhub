"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { mockClients, mockMembershipPlans } from "@/lib/mock-data"
import ClientNav from "@/components/client/client-nav"
import MembershipCard from "@/components/client/membership-card"
import ReservationSection from "@/components/client/reservation-section"
import AnnouncementsSection from "@/components/client/announcements-section"
import { useState, useEffect } from "react"

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration)
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error)
        })
    }
  }, [])

  if (!user) return null

  // Find client data
  const clientData = mockClients.find((c) => c.userId === user.id)
  const plan = clientData?.plan || mockMembershipPlans[0]

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNav user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground mt-2">{user.companyName}</p>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {["overview", "reservations", "wifi", "announcements"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <MembershipCard plan={plan} client={clientData} />
          </div>
        )}

        {activeTab === "reservations" && <ReservationSection clientId={clientData?.id || ""} />}

        {activeTab === "wifi" && (
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-bold mb-4">WiFi Access</h2>
            <div className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Network Name</p>
                <p className="font-mono text-lg">CoWorkHub-5GHz</p>
              </div>
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Password</p>
                <p className="font-mono text-lg">SecurePass2024!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "announcements" && <AnnouncementsSection />}
      </main>
    </div>
  )
}
