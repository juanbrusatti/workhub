"use client"

import { useNotification } from "@/lib/notification-context"

export default function NotificationCenter() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg pointer-events-auto animate-in fade-in slide-in-from-top max-w-md ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : notification.type === "error"
                ? "bg-destructive text-destructive-foreground"
                : notification.type === "warning"
                  ? "bg-amber-500 text-white"
                  : "bg-blue-500 text-white"
          }`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  )
}
