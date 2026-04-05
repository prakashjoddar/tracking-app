"use client"

import { useEffect, useState } from "react"
import { useTripStore } from "@/store/trip-store"
import { TripCard } from "./TripCard"
import { WaypointInitModal } from "./WaypointInitModal"
import { SearchableSelect } from "../ui/searchable-select"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { fetchTrips, deleteTrip, fetchVehicles, fetchStops, initializeWaypoint } from "@/lib/api"
import { Search, Plus, RefreshCw } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

type TripListPanelProps = {
  onAddNew?: () => void
  onEdit?: (id: string) => void
}

export default function TripListPanel({ onAddNew, onEdit }: TripListPanelProps) {

  const [search, setSearch] = useState<string>("")
  const [initTripId, setInitTripId] = useState<string | null>(null)
  const { vehicles, setVehicles } = useVehicleManageStore()
  const pathname = usePathname()

  const {
    trips, selectedTripId, editingTripId, tripsLoading,
    setTrips, setStops, setSelectedTripId, setEditingTripId,
    setTripsLoading, removeTrip, updateTrip, setSelectedVehicleId, selectedVehicleId
  } = useTripStore()

  // Bootstrap vehicle list when navigating directly to /trip
  useEffect(() => {
    if (vehicles.length > 0) return   // already loaded — skip
    fetchVehicles()
      .then(setVehicles)
      .catch(e => console.error("Failed to fetch vehicles:", e))
  }, [])

  // Re-fetch trips + stops whenever the user navigates back to /trip
  useEffect(() => {
    if (pathname !== "/trip") return
    if (selectedVehicleId) {
      fetchTrips(selectedVehicleId)
        .then(setTrips)
        .catch(e => console.error("Refresh trips failed:", e))
    }
    const tripId = selectedTripId ?? editingTripId
    if (tripId) {
      fetchStops(tripId)
        .then(data => setStops(data.map(s => ({ ...s, snapToRoute: true }))))
        .catch(e => console.error("Refresh stops failed:", e))
    }
  }, [pathname])

  // fetch trips when vehicle changes
  const loadTrips = async (vehicleId: string): Promise<void> => {
    if (!vehicleId) return
    try {
      setTripsLoading(true)
      const data = await fetchTrips(vehicleId)
      setTrips(data)
    } catch (e) {
      console.error("Failed to fetch trips:", e)
    } finally {
      setTripsLoading(false)
    }
  }

  const handleVehicleChange = (vehicleId: string): void => {
    setSelectedTripId(null)
    setEditingTripId(null)
    setSelectedVehicleId(vehicleId || null)
    if (vehicleId) {
      loadTrips(vehicleId)
    } else {
      setTrips([])
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteTrip(id)
      removeTrip(id)
    } catch (e) {
      console.error("Delete trip failed:", e)
    }
  }

  const handleEdit = (id: string): void => {
    const next = editingTripId === id ? null : id
    setEditingTripId(next)
    setSelectedTripId(next)   // keep selectedTripId in sync for stop management
    onEdit?.(id)
  }

  const handleInitialize = async (tripId: string, startDate: string, endDate: string): Promise<void> => {
    try {
      const updated = await initializeWaypoint(tripId, startDate, endDate)
      updateTrip(updated.id, updated)
      toast.success("Route initialized successfully.")
    } catch (e: any) {
      console.error("Initialize waypoint failed:", e)
      toast.error(e.response?.data?.message || "Failed to initialize route.")
      throw e   // re-throw so modal stays open on error
    }
  }

  const filtered = trips.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Trips</h2>
            <p className="text-xs text-gray-400">{trips.length} routes</p>
          </div>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {/* Vehicle selector */}
        <SearchableSelect
          options={vehicles.map(v => ({ label: v.number, value: v.id }))}
          value={selectedVehicleId || ""}
          onChange={handleVehicleChange}
          placeholder="Select vehicle..."
          allowDeselect
        />

        {/* Search */}
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {tripsLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            <p className="text-xs">Loading trips...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-xs">No trips found</p>
          </div>
        ) : filtered.map(trip => (
          <TripCard
            key={trip.id}
            id={trip.id}
            name={trip.name}
            type={trip.type}
            enable={trip.enable}
            startTime={trip.startTime}
            endTime={trip.endTime}
            stopCount={trip.stopCount ?? 0}
            staff={trip.staff?.length ?? 0}
            studentCount={trip.studentCount ?? 0}
            hasWaypoint={!!trip.waypoint}
            isEditing={editingTripId === trip.id}
            onEdit={() => handleEdit(trip.id)}
            onDelete={() => handleDelete(trip.id)}
            onInitialize={() => setInitTripId(trip.id)}
          />
        ))}
      </div>

      {initTripId && (() => {
        const trip = trips.find(t => t.id === initTripId)
        return trip ? (
          <WaypointInitModal
            tripName={trip.name}
            onSubmit={(startDate, endDate) => handleInitialize(initTripId, startDate, endDate)}
            onClose={() => setInitTripId(null)}
          />
        ) : null
      })()}
    </div>
  )
}