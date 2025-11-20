"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockAnnouncements } from "@/lib/mock-data"
import { useState } from "react"
import { format } from "date-fns"

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    type: "info" as const,
    priority: "medium" as const,
  })

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      setAnnouncements([
        {
          id: Math.random().toString(),
          ...newAnnouncement,
          createdAt: new Date(),
        },
        ...announcements,
      ])
      setShowForm(false)
      setNewAnnouncement({ title: "", content: "", type: "info", priority: "medium" })
    }
  }

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowForm(!showForm)} className="gap-2">
        {showForm ? "Cancel" : "+ Create Announcement"}
      </Button>

      {showForm && (
        <Card className="p-6 border">
          <h3 className="text-lg font-bold mb-4">New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                placeholder="Announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                placeholder="Announcement content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background min-h-24"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="info">Info</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAddAnnouncement} className="w-full">
              Create Announcement
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-6 border">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground">{format(announcement.createdAt, "MMM dd, yyyy HH:mm")}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={announcement.priority === "high" ? "destructive" : "secondary"}>
                  {announcement.type}
                </Badge>
                <Badge variant="outline">{announcement.priority}</Badge>
              </div>
            </div>
            <p className="text-foreground mb-4">{announcement.content}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteAnnouncement(announcement.id)}
              className="text-destructive"
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
