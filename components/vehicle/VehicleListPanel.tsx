"use client"

import { useEffect, useState } from "react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { VehicleCard } from "./VehicleCard"
import { Search, Plus, RefreshCw } from "lucide-react"
import axios from "axios"
import { Vehicle } from "@/lib/types"

type VehicleListPanelProps = {
    onAddNew: () => void
    onEdit: (id: string) => void
}

export function VehicleListPanel({ onAddNew, onEdit }: VehicleListPanelProps) {

    const [search, setSearch] = useState<string>("")
    const { vehicles, editingVehicleId, setEditingVehicleId, setVehicles, setLoading, loading } = useVehicleManageStore()

    const fetchVehicles = async (): Promise<void> => {
        try {
            setLoading(true)
            const res = await axios.get<Vehicle[]>("http://localhost:6004/vehicle")
            setVehicles(res.data)
        } catch (e) {
            console.error("Failed to fetch vehicles:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVehicles()
    }, [])

    const filtered = vehicles.filter((v) =>
        v.number.toLowerCase().includes(search.toLowerCase()) ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.imei.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sm">Vehicles</h2>
                        <p className="text-xs text-gray-400">{vehicles.length} registered</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchVehicles}
                            className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-500"} />
                        </button>
                        <button
                            onClick={onAddNew}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={13} />
                            Add
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by number, name, IMEI..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {loading && vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <RefreshCw size={20} className="animate-spin" />
                        <p className="text-xs">Loading vehicles...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <p className="text-xs">No vehicles found</p>
                    </div>
                ) : (
                    filtered.map((vehicle) => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            isEditing={editingVehicleId === vehicle.id}
                            onEdit={() => onEdit(vehicle.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}