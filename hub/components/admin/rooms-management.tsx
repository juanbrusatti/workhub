"use client"

import { Card } from "@/components/ui/card"
import { mockRooms } from "@/lib/mock-data"
import { useState } from "react"

export default function RoomsManagement() {
  const [rooms, setRooms] = useState(mockRooms)

  return (
    <div className="space-y-6">
      {rooms.map((room) => (
        <Card key={room.id} className="p-6 border">
          <div className="mb-4">
            <h3 className="text-xl font-bold">{room.name}</h3>
            <p className="text-muted-foreground">{room.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="text-2xl font-bold">{room.capacity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Desks</p>
              <p className="text-2xl font-bold">{room.desks.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {room.desks.filter((d) => d.status === "available").length}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-3">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity, i) => (
                <span key={i} className="px-3 py-1 bg-secondary/50 rounded-full text-sm">
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Desks Status</h4>
            <div className="grid gap-2 md:grid-cols-4">
              {room.desks.map((desk) => (
                <div
                  key={desk.id}
                  className={`p-3 rounded-lg border text-center text-sm font-medium ${
                    desk.status === "available"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                      : desk.status === "reserved"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300"
                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-300"
                  }`}
                >
                  <p>{desk.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{desk.status}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
