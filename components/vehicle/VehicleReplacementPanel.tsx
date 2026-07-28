"use client"

import { useEffect, useState } from "react"
import { fetchVehicles, replaceVehicle, cancelVehicleReplacement } from "@/lib/api"
import { Vehicle } from "@/lib/types"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { RefreshCw, ArrowLeftRight, X, Car, Save, Search } from "lucide-react"
import { toast } from "sonner"

// Builds the vehicleId → replacementVehicleId map from the server's current state.
const toReplacementsMap = (data: Vehicle[]): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const v of data) {
        if (v.replacementVehicleId) map[v.id] = v.replacementVehicleId
    }
    return map
}

export function VehicleReplacementPanel() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    // vehicleId → replacementVehicleId (local edits, may differ from server until Save)
    const [replacements, setReplacements] = useState<Record<string, string>>({})
    // Last-loaded server state, used to diff on Save so we only call the API for changed rows
    const [savedReplacements, setSavedReplacements] = useState<Record<string, string>>({})
    const [search, setSearch] = useState("")

    const load = async () => {
        try {
            setLoading(true)
            const data = await fetchVehicles()
            setVehicles(data)
            const serverState = toReplacementsMap(data)
            setReplacements(serverState)
            setSavedReplacements(serverState)
        } catch {
            toast.error("Failed to load vehicles.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    // All replacement IDs currently assigned
    const takenIds = new Set(Object.values(replacements).filter(Boolean))

    const getOptions = (vehicleId: string) =>
        vehicles
            .filter(v =>
                v.id !== vehicleId &&
                // allow an option if it's not taken by another vehicle
                // (but keep it available if it's the current selection for this vehicle)
                (!takenIds.has(v.id) || replacements[vehicleId] === v.id)
            )
            .map(v => ({
                label: v.number,
                value: v.id,
                subLabel: v.name || undefined,
            }))

    const handleSelect = (vehicleId: string, replacementId: string) => {
        setReplacements(prev => ({ ...prev, [vehicleId]: replacementId }))
    }

    const handleClear = (vehicleId: string) => {
        setReplacements(prev => {
            const next = { ...prev }
            delete next[vehicleId]
            return next
        })
    }

    const handleSaveAll = async () => {
        // Only rows that actually changed since the last server load —
        // assigned/changed → replaceVehicle, cleared → cancelVehicleReplacement.
        const allIds = [...new Set([...Object.keys(replacements), ...Object.keys(savedReplacements)])]
        const changes = allIds.filter(id => replacements[id] !== savedReplacements[id])

        if (changes.length === 0) {
            toast.info("No changes to save.")
            return
        }

        setSaving(true)
        const results = await Promise.allSettled(changes.map(id =>
            replacements[id]
                ? replaceVehicle(id, replacements[id])
                : cancelVehicleReplacement(id)
        ))
        setSaving(false)

        const failures = results.filter(r => r.status === "rejected").length
        const succeeded = results.length - failures

        if (succeeded > 0) {
            toast.success(`${succeeded} replacement${succeeded > 1 ? "s" : ""} saved.`)
        }
        if (failures > 0) {
            toast.error(`${failures} change${failures > 1 ? "s" : ""} failed — vehicle may already be part of another replacement.`)
        }

        await load()
    }

    const handleClearAll = async () => {
        const activeIds = Object.keys(savedReplacements)
        if (activeIds.length === 0) {
            setReplacements({})
            toast.info("Nothing to clear.")
            return
        }

        setSaving(true)
        const results = await Promise.allSettled(activeIds.map(id => cancelVehicleReplacement(id)))
        setSaving(false)

        const failures = results.filter(r => r.status === "rejected").length
        if (failures > 0) {
            toast.error(`${failures} replacement${failures > 1 ? "s" : ""} failed to clear.`)
        } else {
            toast.success("All replacements cleared.")
        }

        await load()
    }

    const filtered = vehicles.filter(v =>
        v.number.toLowerCase().includes(search.toLowerCase()) ||
        (v.name || "").toLowerCase().includes(search.toLowerCase())
    )

    const assignedCount = Object.values(replacements).filter(Boolean).length

    return (
        <div className="h-full flex flex-col bg-white">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b bg-white space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ArrowLeftRight size={18} className="text-blue-600" />
                            Vehicle Replacement
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {assignedCount} of {vehicles.length} vehicles have a replacement assigned
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={load}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-500"
                            title="Refresh"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin text-blue-500" : ""} />
                        </button>
                        <button
                            onClick={handleClearAll}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            <X size={14} />
                            Clear All
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Save
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all max-w-sm">
                    <Search size={13} className="text-slate-400 shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search vehicles..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-slate-400 text-slate-700"
                    />
                </div>
            </div>

            {/* Column labels */}
            <div className="shrink-0 grid grid-cols-2 gap-4 px-6 py-2 border-b bg-slate-50/80">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vehicle</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Replacement Vehicle</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={20} className="animate-spin text-blue-500" />
                        <p className="text-sm">Loading vehicles...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
                        <Car size={24} className="text-slate-300" />
                        <p className="text-sm">No vehicles found</p>
                    </div>
                ) : (
                    filtered.map(vehicle => {
                        const replacement = vehicles.find(v => v.id === replacements[vehicle.id])
                        const options = getOptions(vehicle.id)

                        return (
                            <div
                                key={vehicle.id}
                                className={`grid grid-cols-2 gap-4 items-center px-4 py-3 rounded-xl border transition-all ${
                                    replacements[vehicle.id]
                                        ? "border-blue-200 bg-blue-50/40"
                                        : "border-slate-100 bg-white hover:bg-slate-50/60"
                                }`}
                            >
                                {/* Left — vehicle info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                                        <Car size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{vehicle.number}</p>
                                        {vehicle.name && (
                                            <p className="text-xs text-slate-400 truncate">{vehicle.name}</p>
                                        )}
                                    </div>
                                    {replacements[vehicle.id] && (
                                        <ArrowLeftRight size={14} className="text-blue-400 shrink-0 ml-auto" />
                                    )}
                                </div>

                                {/* Right — replacement picker */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <SearchableSelect
                                            options={options}
                                            value={replacements[vehicle.id] || ""}
                                            onChange={val => handleSelect(vehicle.id, val)}
                                            placeholder="Select replacement..."
                                            allowDeselect
                                        />
                                    </div>
                                    {replacements[vehicle.id] && (
                                        <button
                                            onClick={() => handleClear(vehicle.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                            title="Clear replacement"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    )
}
