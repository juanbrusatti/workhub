import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockAnnouncements } from "@/lib/mock-data"
import { format } from "date-fns"

export default function AnnouncementsSection() {
  return (
    <div className="space-y-4">
      {mockAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="p-6 border">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold">{announcement.title}</h3>
              <p className="text-sm text-muted-foreground">{format(announcement.createdAt, "MMM dd, yyyy")}</p>
            </div>
            <Badge variant={announcement.priority === "high" ? "destructive" : "secondary"}>{announcement.type}</Badge>
          </div>
          <p className="text-foreground">{announcement.content}</p>
        </Card>
      ))}
    </div>
  )
}
