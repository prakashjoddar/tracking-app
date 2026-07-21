"use client"

import { useState } from "react"
import { AlertConfigEntry } from "@/lib/types"
import { AlertConfigCard } from "./AlertConfigCard"
import { AlertConfigDefaultCard } from "./AlertConfigDefaultCard"
import { Search, RefreshCw } from "lucide-react"

type AlertConfigListPanelProps = {
    configs: AlertConfigEntry[]
    loading: boolean
    selectedVehicleNo: string | null
    isEditingDefault: boolean
    onSelect: (vehicleNo: string) => void
    onSelectDefault: () => void
    onRefresh: () => void
}

export function AlertConfigListPanel({ configs, loading, selectedVehicleNo, isEditingDefault, onSelect, onSelectDefault, onRefresh }: AlertConfigListPanelProps) {

    const [search, setSearch] = useState<string>("")

    const filtered = configs.filter((c) =>
        c.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
        (c.vehicleName ?? "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sm">Alert Settings</h2>
                        <p className="text-xs text-gray-400">{configs.length} vehicles</p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-500"} />
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by number, name..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                <AlertConfigDefaultCard
                    unconfiguredCount={configs.filter((c) => !c.overridden).length}
                    isEditing={isEditingDefault}
                    onEdit={onSelectDefault}
                />

                {loading && configs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <RefreshCw size={20} className="animate-spin" />
                        <p className="text-xs">Loading vehicles...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <p className="text-xs">No vehicles found</p>
                    </div>
                ) : (
                    filtered.map((config) => (
                        <AlertConfigCard
                            key={config.vehicleNo}
                            config={config}
                            isEditing={selectedVehicleNo === config.vehicleNo}
                            onEdit={() => onSelect(config.vehicleNo)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
