"use client"

import { Globe, Pencil } from "lucide-react"

type AlertConfigDefaultCardProps = {
    unconfiguredCount: number
    isEditing: boolean
    onEdit: () => void
}

export function AlertConfigDefaultCard({ unconfiguredCount, isEditing, onEdit }: AlertConfigDefaultCardProps) {
    return (
        <div
            onClick={onEdit}
            className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer
            ${isEditing ? "border-indigo-500 bg-indigo-50 shadow-md" : "bg-indigo-50/40 border-indigo-100 hover:shadow-md hover:border-indigo-200"}`}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                    <Globe size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">Org Default</p>
                    <p className="text-xs text-gray-500 truncate">
                        Applies to {unconfiguredCount} vehicle{unconfiguredCount === 1 ? "" : "s"} without their own override
                    </p>
                </div>
            </div>

            <div className="mt-3 flex justify-end">
                <button
                    onClick={onEdit}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors ${isEditing
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-200 text-gray-600 hover:bg-white"
                        }`}
                >
                    <Pencil size={12} />
                    {isEditing ? "Editing" : "Edit"}
                </button>
            </div>
        </div>
    )
}
