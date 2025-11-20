import type { User, MembershipPlan, Client, Room, Announcement, WiFiAccess } from "./types"

export const mockMembershipPlans: MembershipPlan[] = [
  {
    id: "1",
    name: "Starter",
    description: "Perfect for freelancers",
    price: 199,
    billingCycle: "monthly",
    maxDesks: 1,
    features: ["1 Desk access", "WiFi", "Meeting room discount (10%)", "Community access"],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Professional",
    description: "For growing teams",
    price: 499,
    billingCycle: "monthly",
    maxDesks: 5,
    features: ["5 Desks", "WiFi", "Meeting room discount (20%)", "Priority support", "Lounge access"],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    name: "Enterprise",
    description: "Full power for large teams",
    price: 1299,
    billingCycle: "monthly",
    maxDesks: 20,
    features: ["20 Desks", "WiFi", "Free meeting rooms", "24/7 support", "Dedicated account manager"],
    createdAt: new Date("2024-01-01"),
  },
]

export const mockRooms: Room[] = [
  {
    id: "1",
    name: "Open Floor - Level 1",
    description: "Collaborative workspace with natural light",
    capacity: 30,
    desks: [
      { id: "d1", name: "Desk A1", roomId: "1", status: "available", createdAt: new Date() },
      { id: "d2", name: "Desk A2", roomId: "1", status: "reserved", createdAt: new Date() },
      { id: "d3", name: "Desk A3", roomId: "1", status: "available", createdAt: new Date() },
    ],
    amenities: ["WiFi", "Power outlets", "Standing desk option", "Monitor available"],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Quiet Zone - Level 2",
    description: "Focused work area with minimal distractions",
    capacity: 15,
    desks: [
      { id: "d4", name: "Desk Q1", roomId: "2", status: "available", createdAt: new Date() },
      { id: "d5", name: "Desk Q2", roomId: "2", status: "available", createdAt: new Date() },
    ],
    amenities: ["WiFi", "Noise-cancelling headphones", "Monitor", "Private"],
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    name: "Meeting Rooms",
    description: "Private meeting spaces",
    capacity: 12,
    desks: [],
    amenities: ["Projector", "Whiteboard", "Conference phone", "WiFi", "Video conferencing"],
    createdAt: new Date("2024-01-01"),
  },
]

export const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "WiFi Maintenance",
    content: "Network maintenance scheduled for tonight from 10 PM to 6 AM. We apologize for any inconvenience.",
    type: "maintenance",
    priority: "high",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "New Coffee Bar Opening",
    content: "Celebrate our new premium coffee bar on Level 1. Grand opening this Friday!",
    type: "event",
    priority: "low",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Welcome to CoWorkHub",
    content: "Welcome to our community! Check out our amenities and make the most of your workspace.",
    type: "info",
    priority: "medium",
    createdAt: new Date(),
  },
]

export const mockWiFiAccess: WiFiAccess[] = [
  {
    id: "1",
    clientId: "client1",
    ssid: "CoWorkHub-5GHz",
    password: "SecurePass2024!",
    status: "active",
    createdAt: new Date(),
  },
  {
    id: "2",
    clientId: "client1",
    ssid: "CoWorkHub-Guest",
    password: "Guest2024!",
    status: "active",
    createdAt: new Date(),
  },
]

export const mockClients: Client[] = [
  {
    id: "client1",
    userId: "user2",
    user: {
      id: "user2",
      email: "alex@company.com",
      password: "password123",
      name: "Alex Johnson",
      role: "client",
      companyName: "Tech Startup Inc",
      phone: "+1234567890",
      createdAt: new Date("2024-02-01"),
    },
    companyName: "Tech Startup Inc",
    plan: mockMembershipPlans[1],
    subscriptionStartDate: new Date("2024-02-01"),
    subscriptionEndDate: new Date("2025-02-01"),
    status: "active",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "client2",
    userId: "user3",
    user: {
      id: "user3",
      email: "sarah@design.com",
      password: "password123",
      name: "Sarah Design",
      role: "client",
      companyName: "Design Studio",
      phone: "+0987654321",
      createdAt: new Date("2024-01-15"),
    },
    companyName: "Design Studio",
    plan: mockMembershipPlans[0],
    subscriptionStartDate: new Date("2024-01-15"),
    subscriptionEndDate: new Date("2025-01-15"),
    status: "active",
    createdAt: new Date("2024-01-15"),
  },
]

export const mockAdminUser: User = {
  id: "admin1",
  email: "admin@coworkhub.com",
  password: "admin123",
  name: "Admin User",
  role: "admin",
  createdAt: new Date("2024-01-01"),
}

export const mockClientUser: User = {
  id: "user2",
  email: "alex@company.com",
  password: "password123",
  name: "Alex Johnson",
  role: "client",
  companyName: "Tech Startup Inc",
  phone: "+1234567890",
  createdAt: new Date("2024-02-01"),
}
