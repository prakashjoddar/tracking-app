"use client"

import { Vehicle } from "@/lib/types"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { api } from "@/lib/api"
import { Bus, Cpu, Pencil, SatelliteDish, Trash2 } from "lucide-react"
import { toast } from "sonner"

type VehicleCardProps = {
    vehicle: Vehicle
    isEditing: boolean
    onEdit: () => void
}

export function VehicleCard({ vehicle, isEditing, onEdit }: VehicleCardProps) {

    const deleteVehicle = useVehicleManageStore(s => s.deleteVehicle)

    // ✅ Guard empty/invalid dates
    const isExpiringSoon = (dateStr: string): boolean => {
        if (!dateStr) return false
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return false
        const daysLeft = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return daysLeft < 30
    }

    const handleDelete = async (): Promise<void> => {
        if (!confirm("Are you sure you want to delete this vehicle?")) return

        try {
            await api.delete(`/vehicle/${vehicle.id}`)
            deleteVehicle(vehicle.id)
            toast.success("Vehicle deleted successfully")
        } catch (e: any) {
            console.error("Delete failed:", e)
            const msg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : null) || e.message || "Failed to delete vehicle"
            toast.error(msg)
        }
    }

    return (
        <div className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer
            ${isEditing ? "border-blue-500 bg-blue-50 shadow-md" : "bg-white hover:shadow-md hover:border-gray-300"}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Bus size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{vehicle.number}</p>
                        <p className="text-xs text-gray-500 truncate">{vehicle.name || "—"}</p>
                    </div>
                </div>

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${vehicle.rfidType === "NONE"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-green-100 text-green-700"
                    }`}>
                    {vehicle.rfidType}
                </span>
            </div>

            {/* Info row */}
            <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Cpu size={11} />
                    <span className="truncate">{vehicle.deviceManufacturer || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <SatelliteDish size={11} />
                    <span className="truncate">{vehicle.simNumber || "—"}</span>
                </div>
            </div>

            {/* Expiry badges */}
            <div className="mt-2.5 flex gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isExpiringSoon(vehicle.rechargeExpiry)
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    SIM: {vehicle.rechargeExpiry ? new Date(vehicle.rechargeExpiry).toLocaleDateString() : "—"}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isExpiringSoon(vehicle.certificateExpiry)
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    Cert: {vehicle.certificateExpiry ? new Date(vehicle.certificateExpiry).toLocaleDateString() : "—"}
                </span>
            </div>

            {/* IMEI */}
            <p className="mt-2 text-[10px] text-gray-400 font-mono truncate">
                IMEI: {vehicle.imei}
            </p>

            {/* Actions */}
            <div className="mt-3 flex justify-end gap-2">
                <button
                    onClick={handleDelete}
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