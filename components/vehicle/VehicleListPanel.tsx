"use client"

import { useEffect, useState } from "react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { VehicleCard } from "./VehicleCard"
import { Search, Plus, RefreshCw, ArrowUpDown, SortAsc, SortDesc } from "lucide-react"
import { api } from "@/lib/api"
import { Vehicle } from "@/lib/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortField = "number" | "name"
type SortOrder = "asc" | "desc"

type VehicleListPanelProps = {
    onAddNew: () => void
    onEdit: (id: string) => void
}

export function VehicleListPanel({ onAddNew, onEdit }: VehicleListPanelProps) {

    const [search, setSearch] = useState<string>("")
    const [sortField, setSortField] = useState<SortField>("number")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
    const { vehicles, editingVehicleId, setEditingVehicleId, setVehicles, setLoading, loading } = useVehicleManageStore()

    const fetchVehicles = async (): Promise<void> => {
        try {
            setLoading(true)
            const res = await api.get<Vehicle[]>("/vehicle")
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
        (v.imei && v.imei.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => {
        let valA = ""
        let valB = ""
        
        if (sortField === "number") {
            valA = a.number.toLowerCase()
            valB = b.number.toLowerCase()
        } else {
            valA = (a.name || "").toLowerCase()
            valB = (b.name || "").toLowerCase()
        }

        const comparison = valA.localeCompare(valB)
        return sortOrder === "asc" ? comparison : -comparison
    })

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sm">Vehicles</h2>
                        <p className="text-xs text-gray-400">{vehicles.length} registered</p>
                    </div>
                    <div className="flex gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors text-gray-500"
                                    title="Sort"
                                >
                                    <ArrowUpDown size={14} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
                                <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Sort Vehicles</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField("number"); setSortOrder("asc"); }} className="text-xs py-2">
                                    <SortAsc size={14} className="mr-2 text-slate-400" />
                                    <span>Number (A-Z)</span>
                                    {sortField === "number" && sortOrder === "asc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField("number"); setSortOrder("desc"); }} className="text-xs py-2">
                                    <SortDesc size={14} className="mr-2 text-slate-400" />
                                    <span>Number (Z-A)</span>
                                    {sortField === "number" && sortOrder === "desc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="text-xs py-2">
                                    <SortAsc size={14} className="mr-2 text-slate-400" />
                                    <span>Name (A-Z)</span>
                                    {sortField === "name" && sortOrder === "asc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("desc"); }} className="text-xs py-2">
                                    <SortDesc size={14} className="mr-2 text-slate-400" />
                                    <span>Name (Z-A)</span>
                                    {sortField === "name" && sortOrder === "desc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

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