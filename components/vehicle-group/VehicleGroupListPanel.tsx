"use client"

import { useState } from "react"
import { VehicleGroupEntry } from "@/lib/types"
import { VehicleGroupCard } from "./VehicleGroupCard"
import { Search, Plus, RefreshCw } from "lucide-react"

type VehicleGroupListPanelProps = {
    groups: VehicleGroupEntry[]
    loading: boolean
    selectedGroupId: string | null
    onSelect: (id: string) => void
    onAddNew: () => void
    onDelete: (id: string) => void
    onRefresh: () => void
}

export function VehicleGroupListPanel({ groups, loading, selectedGroupId, onSelect, onAddNew, onDelete, onRefresh }: VehicleGroupListPanelProps) {

    const [search, setSearch] = useState<string>("")

    const filtered = groups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description ?? "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sm">Vehicle Groups</h2>
                        <p className="text-xs text-gray-400">{groups.length} groups</p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={onRefresh}
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
                            New
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, description..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                {loading && groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <RefreshCw size={20} className="animate-spin" />
                        <p className="text-xs">Loading groups...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                        <p className="text-xs">No vehicle groups found</p>
                    </div>
                ) : (
                    filtered.map((group) => (
                        <VehicleGroupCard
                            key={group.id}
                            group={group}
                            isEditing={selectedGroupId === group.id}
                            onEdit={() => onSelect(group.id)}
                            onDelete={() => onDelete(group.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
