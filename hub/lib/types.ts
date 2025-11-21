export type UserRole = "admin" | "client"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyName?: string
  phone?: string
  createdAt?: Date | null
}

export interface MembershipPlan {
  id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly"
  maxDesks: number
  features: string[]
  createdAt: Date
}

export interface Client {
  id: string
  userId: string
  user: User
  companyName: string
  plan: MembershipPlan
  subscriptionStartDate: Date
  subscriptionEndDate: Date
  status: "active" | "inactive" | "suspended"
  createdAt: Date
}

export interface Desk {
  id: string
  name: string
  roomId: string
  status: "available" | "reserved" | "maintenance"
  createdAt: Date
}

export interface Room {
  id: string
  name: string
  description: string
  capacity: number
  desks: Desk[]
  amenities: string[]
  createdAt: Date
}

export interface Reservation {
  id: string
  clientId: string
  deskId: string
  desk?: Desk
  date: Date
  startTime: string
  endTime: string
  status: "confirmed" | "cancelled" | "completed"
  createdAt: Date
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: "info" | "maintenance" | "event"
  priority: "low" | "medium" | "high"
  createdAt: Date
  expiresAt?: Date
}

export interface WiFiAccess {
  id: string
  clientId: string
  ssid: string
  password: string
  status: "active" | "inactive"
  createdAt: Date
}

export interface Payment {
  id: string
  clientId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed"
  planId: string
  transactionId: string
  createdAt: Date
}
