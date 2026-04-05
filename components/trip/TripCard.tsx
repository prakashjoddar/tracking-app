"use client"

import { TripType } from "@/lib/types"
import { Bus, MapPin, Users, UserCheck, GraduationCap, Pencil, Trash2, Clock, Wand2 } from "lucide-react"

type TripCardProps = {
    id: string
    name: string                           // was "route"
    type: TripType
    enable: boolean                        // from Trip type
    startTime?: string
    endTime?: string
    stopCount?: number
    staff?: number
    studentCount?: number
    status?: "CREATED" | "INITIALIZED" | "COMPLETED"
    hasWaypoint?: boolean
    isEditing?: boolean
    onEdit?: () => void
    onDelete?: () => void
    onInitialize?: () => void
}

const STATUS_STYLES: Record<string, string> = {
    CREATED: "bg-gray-100 text-gray-500",
    INITIALIZED: "bg-amber-100 text-amber-600",
    COMPLETED: "bg-green-100 text-green-600",
}

const TYPE_STYLES: Record<string, string> = {
    PICKING: "bg-blue-100 text-blue-600",
    DROPPING: "bg-purple-100 text-purple-600",
}

export function TripCard({ name, type, enable, startTime, endTime, stopCount = 0, staff = 0, studentCount = 0, status, hasWaypoint, isEditing, onEdit, onDelete, onInitialize }: TripCardProps) {
    return (
        <div className={`rounded-xl border p-4 shadow-sm transition-all
            ${isEditing
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "bg-white hover:shadow-md hover:border-gray-300"
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Bus size={15} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_STYLES[type]}`}>
                                {type}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status ?? "CREATED"]}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} className="shrink-0" />
                    <span>{stopCount} stops</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <UserCheck size={11} className="shrink-0" />
                    <span>{staff} staff</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <GraduationCap size={11} className="shrink-0" />
                    <span>{studentCount} students</span>
                </div>
                {startTime && endTime && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={11} className="shrink-0" />
                        <span>{startTime} – {endTime}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex justify-end gap-2">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={11} />
                    Delete
                </button>
                <button
                    onClick={onInitialize}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors
                        ${hasWaypoint
                            ? "border-amber-400 text-amber-600 hover:bg-amber-50"
                            : "border-green-400 text-green-600 hover:bg-green-50"
                        }`}
                >
                    <Wand2 size={11} />
                    {hasWaypoint ? "Re-Init" : "Initialize"}
                </button>
                <button
                    onClick={onEdit}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors
                        ${isEditing
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    <Pencil size={11} />
                    {isEditing ? "Editing" : "Edit"}
                </button>
            </div>
        </div>
    )
}