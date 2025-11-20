"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockRooms } from "@/lib/mock-data"
import { format } from "date-fns"

interface ReservationSectionProps {
  clientId: string
}

export default function ReservationSection({ clientId }: ReservationSectionProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedRoom, setSelectedRoom] = useState("1")
  const [reservations, setReservations] = useState<any[]>([])

  const handleReserveDesk = (deskId: string, deskName: string) => {
    const reservation = {
      id: Math.random().toString(),
      deskId,
      deskName,
      date: selectedDate,
      startTime: "09:00",
      endTime: "17:00",
      status: "confirmed",
    }
    setReservations([...reservations, reservation])
  }

  const handleCancelReservation = (id: string) => {
    setReservations(reservations.filter((r) => r.id !== id))
  }

  const room = mockRooms.find((r) => r.id === selectedRoom)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 border">
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
        </Card>

        <Card className="p-4 border">
          <label className="block text-sm font-medium mb-2">Select Room</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            {mockRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Card>
      </div>

      <Card className="p-6 border">
        <h3 className="text-xl font-bold mb-4">{room?.name}</h3>
        <p className="text-muted-foreground mb-6">{room?.description}</p>

        <h4 className="font-semibold mb-4">Available Desks</h4>
        <div className="grid gap-3 md:grid-cols-3 mb-6">
          {room?.desks && room.desks.length > 0 ? (
            room.desks.map((desk) => (
              <div
                key={desk.id}
                className={`p-4 border-2 rounded-lg transition ${
                  desk.status === "available"
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20 cursor-pointer"
                    : "border-gray-300 bg-gray-50 dark:bg-gray-900/20 opacity-50"
                }`}
              >
                <p className="font-semibold">{desk.name}</p>
                <p className="text-sm text-muted-foreground capitalize mb-3">{desk.status}</p>
                {desk.status === "available" && (
                  <Button size="sm" onClick={() => handleReserveDesk(desk.id, desk.name)} className="w-full">
                    Reserve
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-muted-foreground">No desks in this room</div>
          )}
        </div>
      </Card>

      {reservations.length > 0 && (
        <Card className="p-6 border">
          <h3 className="text-xl font-bold mb-4">Your Reservations</h3>
          <div className="space-y-3">
            {reservations.map((res) => (
              <div key={res.id} className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-semibold">{res.deskName}</p>
                  <p className="text-sm text-muted-foreground">
                    {res.date} • {res.startTime} - {res.endTime}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelReservation(res.id)}
                  className="text-destructive"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
