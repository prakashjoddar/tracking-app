"use client"

import { Geofence } from "@/lib/types"
import { useGeofenceStore } from "@/store/geofence-store"
import { MapPin, Edit2, Trash2, Circle, Navigation } from "lucide-react"
import { deleteGeofence } from "@/lib/api"
import { toast } from "sonner"

interface GeofenceCardProps {
    geofence: Geofence
    isEditing: boolean
    onEdit: () => void
}

export function GeofenceCard({ geofence, isEditing, onEdit }: GeofenceCardProps) {
    const { removeGeofence } = useGeofenceStore()

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`Are you sure you want to delete ${geofence.name}?`)) return
        
        try {
            if (geofence.id) {
                await deleteGeofence(geofence.id)
                removeGeofence(geofence.id)
                toast.success("Geofence removed")
            }
        } catch (e: any) {
            console.error("Delete failed:", e)
            toast.error("Failed to delete geofence")
        }
    }

    return (
        <div
            onClick={onEdit}
            style={{ borderLeftColor: geofence.color || "#3b82f6" }}
            className={`cursor-pointer border border-l-4 rounded-xl p-3.5 shadow-sm transition-all group
            ${isEditing ? "bg-blue-50/50 ring-1 ring-blue-500/20" : "bg-white hover:shadow-md hover:border-gray-300"}
        `}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="p-1.5 rounded-lg shrink-0 transition-colors"
                        style={{ backgroundColor: `${geofence.color || "#3b82f6"}22` }}
                    >
                        <Circle size={15} style={{ color: geofence.color || "#3b82f6" }} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{geofence.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${geofence.enable 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-500"
                            }`}>
                                {geofence.enable ? "Active" : "Disabled"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {geofence.radius}m Radius
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Edit2 size={12} />
                    </button>
                    <button onClick={handleDelete} className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                <Navigation size={10} className="text-slate-400" />
                <span className="font-mono truncate">
                    {geofence.latitude.toFixed(5)}, {geofence.longitude.toFixed(5)}
                </span>
            </div>
            
            {geofence.address && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors px-1">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{geofence.address}</span>
                </div>
            )}
        </div>
    )
}
