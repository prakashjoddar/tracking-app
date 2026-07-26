"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { VehicleListPanel } from "@/components/vehicle/VehicleListPanel"
import { VehicleForm } from "@/components/vehicle/VehicleForm"
import { useVehicleManageStore } from "@/store/vehicle-store"

type FormMode = "add" | "edit" | null

export default function VehiclesPage() {

    const [formMode, setFormMode] = useState<FormMode>(null)
    const setEditingVehicleId = useVehicleManageStore(s => s.setEditingVehicleId)
    const vehicles = useVehicleManageStore(s => s.vehicles)
    const router = useRouter()

    // Deep-link from the Dashboard's vehicle card ("Edit" button): ?vehicleNo=<no> — resolved to
    // this vehicle's id once VehicleListPanel's own fetch populates the store, then the form opens
    // exactly as if the user clicked Edit themselves. Runs once per page load.
    const handledDeepLink = useRef(false)
    useEffect(() => {
        if (handledDeepLink.current) return
        const vehicleNo = new URLSearchParams(window.location.search).get("vehicleNo")
        if (!vehicleNo || vehicles.length === 0) return
        const match = vehicles.find(v => v.number === vehicleNo)
        if (match) {
            setEditingVehicleId(match.id)
            setFormMode("edit")
        }
        handledDeepLink.current = true
        router.replace("/vehicle", { scroll: false })
    }, [vehicles, setEditingVehicleId, router])

    const handleAddNew = (): void => {
        setEditingVehicleId(null)   // clear any previous selection
        setFormMode("add")
    }

    // ✅ Bug 1 & 3 fixed — accepts id and sets it in store
    const handleEdit = (id: string): void => {
        setEditingVehicleId(id)     // tell store which vehicle
        setFormMode("edit")         // open form
    }

    const handleClose = (): void => {
        setFormMode(null)
        setEditingVehicleId(null)
    }

    // ✅ Bug 2 fixed — removed the broken useState watcher entirely
    // handleEdit now does both jobs in one call

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT — vehicle list */}
            <div className="w-[380px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <VehicleListPanel onAddNew={handleAddNew} onEdit={handleEdit} />
            </div>

            {/* RIGHT — form or empty state */}
            <div className="flex-1 h-full overflow-hidden">
                {formMode ? (
                    <VehicleForm mode={formMode} onClose={handleClose} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-7 13h7a2 2 0 002-2v-7a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">No vehicle selected</p>
                        <p className="text-xs">Click Edit on a vehicle or Add to create a new one</p>
                    </div>
                )}
            </div>

        </div>
    )
}