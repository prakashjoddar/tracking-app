import { useTripStore } from "@/store/trip-store"
import { ArrowLeft, Save, Plus, Route, Magnet, RefreshCw } from "lucide-react"
import StopList from "./StopList"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchStops, saveStops, deleteStops } from "@/lib/api"
import { toast } from "sonner"

export default function StopListPanel() {

  const snapToRoute = useTripStore(s => s.snapToRoute)
  const setSnapToRoute = useTripStore(s => s.setSnapToRoute)
  const router = useRouter()
  const { selectedTripId, editingTripId, trips, setStops, stopsLoading, setStopsLoading, stops, deletedStopIds, clearDeletedStops, removeStop, updateStop, setEditingStopId, setShowMapOrStopForm } = useTripStore()

  // Use whichever trip ID is available — selectedTripId (from vehicle picker) or
  // editingTripId (from clicking Edit on a trip card and going straight to stops)
  const tripId = selectedTripId ?? editingTripId
  const tripName = trips.find(t => t.id === tripId)?.name ?? "Route"

  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    if (!tripId) return
    const load = async (): Promise<void> => {
      try {
        setStops([])
        clearDeletedStops()
        setStopsLoading(true)
        const data = await fetchStops(tripId)
        setStops(data.map(s => ({ ...s, snapToRoute: true })))
      } catch (e) {
        console.error("Failed to load stops:", e)
      } finally {
        setStopsLoading(false)
      }
    }
    load()
  }, [tripId])

  // Delete pending + bulk save remaining in one Save click
  const handleSaveAll = async (): Promise<void> => {
    if (!tripId) return
    try {
      setSaving(true)

      // 1. Delete stops that were removed from the list (single batch request)
      if (deletedStopIds.length > 0) {
        await deleteStops(deletedStopIds)
        clearDeletedStops()
      }

      // 2. Bulk save remaining stops
      if (stops.length > 0) {
        const payload = stops.map((stop, index) => ({
          // omit temp IDs so the server generates a real one
          ...(stop.id && !stop.id.startsWith("temp_") ? { id: stop.id } : {}),
          name: stop.name,
          enable: stop.enable,
          type: stop.type,
          latitude: stop.latitude,
          longitude: stop.longitude,
          studentId: stop.studentId ?? [],
          tripId,
          sequence: index + 1,
        }))
        const results = await saveStops(payload)
        // Replace local stops with server-returned list (resolves temp IDs)
        setStops(results.map(s => ({ ...s, snapToRoute: true })))
      }

      toast.success("Stops saved")
    } catch (e) {
      console.error("Failed to save stops:", e)
      toast.error("Failed to save stops")
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="flex flex-col h-full">

      <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Route size={14} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm truncate max-w-[140px]">{tripName}</h2>
              <p className="text-xs text-gray-400">{stops.length} stops configured</p>
            </div>
          </div>

          {/* 👇 snap toggle */}
          <button
            onClick={() => setSnapToRoute(!snapToRoute)}
            title={snapToRoute ? "Snap to route ON" : "Snap to route OFF"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${snapToRoute
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
              }`}
          >
            <Magnet size={12} />
            {snapToRoute ? "Snapping" : "Free"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => router.push("/trip")}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || !tripId || (stops.length === 0 && deletedStopIds.length === 0)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            {saving
              ? <RefreshCw size={12} className="animate-spin" />
              : <Save size={12} />
            }
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => { setEditingStopId(null); setShowMapOrStopForm(false) }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            <Plus size={12} />
            Add Stop
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <StopList />
      </div>
    </div>
  )
}