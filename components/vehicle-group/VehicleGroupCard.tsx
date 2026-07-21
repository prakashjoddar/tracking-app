"use client"

import { VehicleGroupEntry } from "@/lib/types"
import { Layers, Pencil, Trash2 } from "lucide-react"

type VehicleGroupCardProps = {
    group: VehicleGroupEntry
    isEditing: boolean
    onEdit: () => void
    onDelete: () => void
}

export function VehicleGroupCard({ group, isEditing, onEdit, onDelete }: VehicleGroupCardProps) {
    return (
        <div
            onClick={onEdit}
            className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer
            ${isEditing ? "border-blue-500 bg-blue-50 shadow-md" : "bg-white hover:shadow-md hover:border-gray-300"}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-purple-100 rounded-lg shrink-0">
                        <Layers size={16} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{group.name}</p>
                        <p className="text-xs text-gray-500 truncate">{group.description || "—"}</p>
                    </div>
                </div>

                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-purple-100 text-purple-700">
                    {group.vehicleNumbers.length} vehicle{group.vehicleNumbers.length === 1 ? "" : "s"}
                </span>
            </div>

            <div className="mt-3 flex justify-end gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={12} />
                    Delete
                </button>
                <button
                    onClick={onEdit}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors ${isEditing
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Pencil size={12} />
                    {isEditing ? "Editing" : "Edit"}
                </button>
            </div>
        </div>
    )
}
