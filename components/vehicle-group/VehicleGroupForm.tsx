"use client"

import { useEffect, useMemo, useState } from "react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { VehicleGroupEntry, VehicleGroupSaveRequest } from "@/lib/types"
import { saveVehicleGroup } from "@/lib/api"
import { Switch } from "@/components/ui/switch"
import { Bus, Check, Layers, Save, Search, X } from "lucide-react"
import { toast } from "sonner"

type VehicleGroupFormProps = {
    group: VehicleGroupEntry | null
    allGroups: VehicleGroupEntry[]
    onClose: () => void
    onSaved: (saved: VehicleGroupEntry) => void
}

const EMPTY = { name: "", description: "" }

export function VehicleGroupForm({ group, allGroups, onClose, onSaved }: VehicleGroupFormProps) {

    const { vehicles, fetchVehicles } = useVehicleManageStore()

    const [form, setForm] = useState(group ? { name: group.name, description: group.description ?? "" } : EMPTY)
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(group?.vehicleIds ?? [])
    const [search, setSearch] = useState("")
    const [excludeAssigned, setExcludeAssigned] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [])

    useEffect(() => {
        setForm(group ? { name: group.name, description: group.description ?? "" } : EMPTY)
        setSelectedVehicleIds(group?.vehicleIds ?? [])
        setSearch("")
    }, [group])

    // Vehicle ids already assigned to some OTHER group (excludes the one being edited).
    const assignedElsewhere = useMemo(() => {
        const ids = new Set<string>()
        for (const g of allGroups) {
            if (group && g.id === group.id) continue
            g.vehicleIds.forEach((id) => ids.add(id))
        }
        return ids
    }, [allGroups, group])

    const filteredVehicles = vehicles
        .filter((v) =>
            v.number.toLowerCase().includes(search.toLowerCase()) ||
            (v.name ?? "").toLowerCase().includes(search.toLowerCase())
        )
        .filter((v) => !excludeAssigned || !assignedElsewhere.has(v.id) || selectedVehicleIds.includes(v.id))

    const toggleVehicle = (id: string): void => {
        setSelectedVehicleIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])
    }

    const handleSave = async (): Promise<void> => {
        if (!form.name.trim()) {
            toast.error("Group name is required")
            return
        }
        try {
            setSaving(true)
            const payload: VehicleGroupSaveRequest = {
                id: group?.id,
                name: form.name,
                description: form.description,
                vehicleIds: selectedVehicleIds,
            }
            const saved = await saveVehicleGroup(payload)
            onSaved(saved)
            toast.success(group ? "Vehicle group updated successfully!" : "Vehicle group created successfully!")
        } catch (e: any) {
            console.error("Save failed:", e)
            const msg = e.response?.data?.message || (typeof e.response?.data === "string" ? e.response.data : null) || e.message || "Failed to save vehicle group"
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-sm">{group ? "Edit Vehicle Group" : "New Vehicle Group"}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {group ? group.name : "Create a group and assign vehicles to it"}
                    </p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Layers size={13} />
                        <span>Group Info</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Name *</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. North Region"
                            className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional notes..."
                            rows={2}
                            className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <Bus size={13} />
                        <span>Vehicles</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <label className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-100 bg-gray-50 cursor-pointer">
                        <span className="text-xs font-medium text-gray-600">Exclude vehicles already in another group</span>
                        <Switch checked={excludeAssigned} onCheckedChange={setExcludeAssigned} />
                    </label>

                    <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
                        <Search size={13} className="text-gray-400 shrink-0" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by number, name..."
                            className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                        />
                    </div>

                    <p className="text-xs text-gray-400">{selectedVehicleIds.length} of {vehicles.length} selected</p>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {filteredVehicles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                                <p className="text-xs">No vehicles found</p>
                            </div>
                        ) : filteredVehicles.map((v) => {
                            const isSelected = selectedVehicleIds.includes(v.id)
                            const inOtherGroup = assignedElsewhere.has(v.id)
                            return (
                                <div
                                    key={v.id}
                                    onClick={() => toggleVehicle(v.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                        ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                        ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
                                    >
                                        {isSelected ? <Check size={14} /> : <Bus size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{v.number}</p>
                                        <p className="text-xs text-gray-500 truncate">{v.name || "—"}</p>
                                    </div>
                                    {inOtherGroup && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                                            In another group
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
                >
                    <Save size={14} />
                    {saving ? "Saving..." : group ? "Update" : "Create Group"}
                </button>
            </div>

        </div>
    )
}
