"use client"

import { useEffect, useState } from "react"
import { GoogleMapView } from "@/components/map/GoogleMapView"
import { GeofenceListPanel } from "@/components/geofence/GeofenceListPanel"
import { GeofenceForm } from "@/components/geofence/GeofenceForm"
import { useGeofenceStore } from "@/store/geofence-store"

export default function GeofencePage() {
    const { setEditingGeofence, editingGeofenceId } = useGeofenceStore()
    const [formMode, setFormMode] = useState<"add" | "edit" | null>(null)

    // Open edit form when a geofence is selected from the map marker click
    useEffect(() => {
        if (editingGeofenceId && formMode !== "edit") {
            setFormMode("edit")
        }
    }, [editingGeofenceId])

    const handleAddNew = (): void => {
        setEditingGeofence(null)
        setFormMode("add")
    }

    const handleEdit = (id: string): void => {
        setEditingGeofence(id)
        setFormMode("edit")
    }

    const handleCloseForm = (): void => {
        setFormMode(null)
        setEditingGeofence(null)
    }

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT PANEL — list or form, never both */}
            <div className="w-[420px] border-r flex flex-col h-full overflow-hidden shrink-0">
                {formMode ? (
                    <GeofenceForm mode={formMode} onClose={handleCloseForm} />
                ) : (
                    <GeofenceListPanel onAddNew={handleAddNew} onEdit={handleEdit} />
                )}
            </div>

            {/* RIGHT — map always visible */}
            <div className="flex-1 relative h-full">
                <GoogleMapView />

                {/* Hint banner when placing */}
                {formMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2">
                            <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                            CLICK ON MAP TO SET CENTER
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}