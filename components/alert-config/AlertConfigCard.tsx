"use client"

import { AlertConfigEntry } from "@/lib/types"
import { Bus, Gauge, Pencil } from "lucide-react"

type AlertConfigCardProps = {
    config: AlertConfigEntry
    isEditing: boolean
    onEdit: () => void
}

export function AlertConfigCard({ config, isEditing, onEdit }: AlertConfigCardProps) {

    const enabledCount = [
        config.ignitionAlert, config.overSpeedAlert, config.stateAlert,
        config.lowBatteryAlert, config.geoFenceAlert, config.tripAlert,
        config.harshDrivingAlert, config.externalPowerAlert, config.tamperingAlert,
    ].filter(Boolean).length

    return (
        <div
            onClick={onEdit}
            className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer
            ${isEditing ? "border-blue-500 bg-blue-50 shadow-md" : "bg-white hover:shadow-md hover:border-gray-300"}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Bus size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{config.vehicleNo}</p>
                        <p className="text-xs text-gray-500 truncate">{config.vehicleName || "—"}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.overridden
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                        }`}>
                        {config.overridden ? "Custom" : "Using Default"}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${enabledCount === 9
                        ? "bg-green-100 text-green-700"
                        : enabledCount === 0
                            ? "bg-gray-100 text-gray-500"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {enabledCount}/9 alerts
                    </span>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Gauge size={11} />
                <span>Over speed limit: {config.overSpeedLimit} km/h</span>
            </div>

            <div className="mt-3 flex justify-end">
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
