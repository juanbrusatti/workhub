import type React from "react"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationProvider } from "@/lib/notification-context"
import NotificationCenter from "@/components/notification-center"
import CacheCleanerProvider from "@/components/common/cache-cleaner-provider"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "CoWorkHub - Premium Coworking Space",
  description: "Manage your coworking membership, reserve desks, and access premium workspace features",
  applicationName: "CoWorkHub",
  authors: [{ name: "CoWorkHub Team" }],
  generator: "Next.js",
  keywords: ["coworking", "workspace", "desk reservation", "professional space"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoWorkHub",
  },
  icons: {
    icon: [
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon-180x180.png",
    shortcut: "/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <CacheCleanerProvider>
              {children}
              <NotificationCenter />
            </CacheCleanerProvider>
          </NotificationProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
