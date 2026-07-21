"use client"

import { useCallback, useEffect, useState } from "react"
import { VehicleGroupListPanel } from "@/components/vehicle-group/VehicleGroupListPanel"
import { VehicleGroupForm } from "@/components/vehicle-group/VehicleGroupForm"
import { fetchVehicleGroups, deleteVehicleGroup } from "@/lib/api"
import { VehicleGroupEntry } from "@/lib/types"
import { toast } from "sonner"

type FormMode = "add" | "edit" | null

export default function VehicleGroupPage() {

    const [groups, setGroups] = useState<VehicleGroupEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [formMode, setFormMode] = useState<FormMode>(null)
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

    const load = useCallback(async (): Promise<void> => {
        try {
            setLoading(true)
            const data = await fetchVehicleGroups()
            setGroups(data)
        } catch (e) {
            console.error("Failed to fetch vehicle groups:", e)
            toast.error("Failed to load vehicle groups")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null

    const handleAddNew = (): void => {
        setSelectedGroupId(null)
        setFormMode("add")
    }

    const handleSelect = (id: string): void => {
        setSelectedGroupId(id)
        setFormMode("edit")
    }

    const handleClose = (): void => {
        setSelectedGroupId(null)
        setFormMode(null)
    }

    const handleSaved = (saved: VehicleGroupEntry): void => {
        setGroups((prev) => {
            const exists = prev.some((g) => g.id === saved.id)
            return exists ? prev.map((g) => (g.id === saved.id ? saved : g)) : [saved, ...prev]
        })
        setSelectedGroupId(saved.id)
        setFormMode("edit")
    }

    const handleDelete = async (id: string): Promise<void> => {
        if (!confirm("Are you sure you want to delete this vehicle group?")) return
        try {
            await deleteVehicleGroup(id)
            setGroups((prev) => prev.filter((g) => g.id !== id))
            if (selectedGroupId === id) handleClose()
            toast.success("Vehicle group deleted successfully")
        } catch (e: any) {
            console.error("Delete failed:", e)
            toast.error(e.response?.data?.message || "Failed to delete vehicle group")
        }
    }

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT — group list */}
            <div className="w-[380px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <VehicleGroupListPanel
                    groups={groups}
                    loading={loading}
                    selectedGroupId={selectedGroupId}
                    onSelect={handleSelect}
                    onAddNew={handleAddNew}
                    onDelete={handleDelete}
                    onRefresh={load}
                />
            </div>

            {/* RIGHT — form or empty state */}
            <div className="flex-1 h-full overflow-hidden">
                {formMode ? (
                    <VehicleGroupForm
                        group={selectedGroup}
                        allGroups={groups}
                        onClose={handleClose}
                        onSaved={handleSaved}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-7 13h7a2 2 0 002-2v-7a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">No group selected</p>
                        <p className="text-xs">Click Edit on a group or New to create one</p>
                    </div>
                )}
            </div>

        </div>
    )
}
