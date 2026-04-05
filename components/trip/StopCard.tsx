"use client"

import { Stop } from "@/lib/types"
import { useTripStore } from "@/store/trip-store"
import { MapPin, Pencil, Trash2, Navigation } from "lucide-react"

type StopCardProps = {
    stop: Stop
    index: number
}

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
    BUS_STOP:  { label: "Bus Stop",   color: "bg-blue-100 text-blue-600" },
    PICK_DROP: { label: "Pick/Drop",  color: "bg-purple-100 text-purple-600" },
    INSTITUTE: { label: "Institute",  color: "bg-green-100 text-green-600" },
}

export function StopCard({ stop, index }: StopCardProps) {

    const markStopDeleted = useTripStore(s => s.markStopDeleted)
    const setShowMapOrStopForm = useTripStore(s => s.setShowMapOrStopForm)
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)
    const editingStopId = useTripStore(s => s.editingStopId)
    const setEditingStopId = useTripStore(s => s.setEditingStopId)

    const isEditing = editingStopId === stop.id
    const typeInfo = TYPE_STYLES[stop.type] ?? TYPE_STYLES.PICK_DROP

    const handleEdit = (): void => {
        setEditingStopId(stop.id)
        setPendingLatLng({ lat: stop.latitude, lng: stop.longitude })
        setShowMapOrStopForm(false)
    }

    const handleDelete = (): void => {
        markStopDeleted(stop.id)
    }

    return (
        <div className={`rounded-xl border p-3.5 shadow-sm transition-all
            ${isEditing
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "bg-white hover:shadow-md hover:border-gray-300"
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <MapPin size={13} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {stop.name || `Stop ${index + 1}`}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                        </span>
                    </div>
                </div>

                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${stop.enable
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                    }`}>
                    {stop.enable ? "Active" : "Disabled"}
                </span>
            </div>

            {/* Coordinates */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                <Navigation size={10} className="shrink-0" />
                <span>{stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}</span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex justify-end gap-2">
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={11} />
                    Delete
                </button>
                <button
                    onClick={handleEdit}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors
                        ${isEditing
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Pencil size={11} />
                    {isEditing ? "Editing" : "Edit"}
                </button>
            </div>
        </div>
    )
}