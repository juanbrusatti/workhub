"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("PWA installed")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-card border shadow-lg rounded-lg p-4 z-40 animate-in slide-in-from-bottom">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-sm">Install CoWorkHub</h3>
          <p className="text-xs text-muted-foreground mt-1">Access your workspace from anywhere</p>
        </div>
        <button onClick={() => setShowPrompt(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleInstall} className="flex-1">
          Install
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPrompt(false)} className="flex-1">
          Maybe Later
        </Button>
      </div>

      {isIOS && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">📱 On iOS: Tap Share → Add to Home Screen</p>
      )}
    </div>
  )
}
