import { Stop } from "@/lib/types"
import { useTripStore } from "@/store/trip-store"

type StopCardProps = {
    stop: Stop
    index: number
}

export function StopCard({ stop, index }: StopCardProps) {
    const removeStop = useTripStore(s => s.removeStop)
    const setEditingStopId = useTripStore(s => s.setEditingStopId)
    const setShowMapOrStopForm = useTripStore(s => s.setShowMapOrStopForm)
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)

    // const handleEdit = () => {
    //     // Fill form with this stop's data and switch to form view
    //     setPendingLatLng({ lat: stop.latitude, lng: stop.longitude })
    //     setShowMapOrStopForm(false)
    // }
    const handleEdit = (): void => {
        setEditingStopId(stop.id)               // 👈 tell store which stop
        setShowMapOrStopForm(false)             // switch to form
    }

    const handleDelete = () => {
        removeStop(stop.id)
    }

    return (
        <div className="border rounded-lg p-3 shadow-sm">
            <div className="font-medium">{stop.name || `Stop ${index + 1}`}</div>
            <div className="text-xs text-gray-400 mt-0.5">
                {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
            </div>
            <div className="text-xs text-gray-500 mt-1 capitalize">
                {stop.type} · {stop.enabled ? "Enabled" : "Disabled"}
            </div>

            <div className="flex justify-end text-sm gap-3">
                <button
                    onClick={handleDelete}
                    className="mt-3 border rounded px-5 py-1 text-sm bg-red-500 text-white hover:bg-red-700 cursor-pointer"
                >
                    Delete
                </button>
                <button
                    onClick={handleEdit}
                    className="mt-3 border rounded px-5 py-1 text-sm bg-blue-500 text-white hover:bg-blue-700 cursor-pointer"
                >
                    Edit
                </button>
            </div>
        </div>
    )
}