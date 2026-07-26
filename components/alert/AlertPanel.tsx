"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchTripAlerts, fetchVehicleAlerts } from "@/lib/api"
import { Alert, AlertType, VehicleAlert, VehicleAlertType } from "@/lib/types"
import {
    Bell, RefreshCw, ChevronLeft, ChevronRight, Route, Gauge, Bus,
    PlayCircle, CheckCircle2, Navigation, MapPin, ArrowRightCircle, AlertTriangle,
    Zap, PowerOff, Activity, Pause, BatteryWarning, LogIn, LogOut, type LucideIcon,
} from "lucide-react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

const DEFAULT_PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const tripTypeStyle: Record<AlertType, string> = {
    TRIP_STARTED: "bg-green-50 text-green-700 border-green-200",
    TRIP_FINISHED: "bg-slate-100 text-slate-600 border-slate-200",
    BUS_APPROACHING_STOP: "bg-yellow-50 text-yellow-700 border-yellow-200",
    BUS_ARRIVED_AT_STOP: "bg-blue-50 text-blue-700 border-blue-200",
    BUS_DEPARTED_STOP: "bg-purple-50 text-purple-700 border-purple-200",
    STOP_SKIPPED_MISSED: "bg-red-50 text-red-700 border-red-200",
}

const tripTypeLabel: Record<AlertType, string> = {
    TRIP_STARTED: "Trip Started",
    TRIP_FINISHED: "Trip Finished",
    BUS_APPROACHING_STOP: "Approaching Stop",
    BUS_ARRIVED_AT_STOP: "Arrived at Stop",
    BUS_DEPARTED_STOP: "Departed Stop",
    STOP_SKIPPED_MISSED: "Stop Skipped",
}

const tripTypeIcon: Record<AlertType, LucideIcon> = {
    TRIP_STARTED: PlayCircle,
    TRIP_FINISHED: CheckCircle2,
    BUS_APPROACHING_STOP: Navigation,
    BUS_ARRIVED_AT_STOP: MapPin,
    BUS_DEPARTED_STOP: ArrowRightCircle,
    STOP_SKIPPED_MISSED: AlertTriangle,
}

const tripAccent: Partial<Record<AlertType, string>> = {
    STOP_SKIPPED_MISSED: "#f87171",
}

const vehicleTypeStyle: Record<VehicleAlertType, string> = {
    IGNITION_ON: "bg-green-50 text-green-700 border-green-200",
    IGNITION_OFF: "bg-slate-100 text-slate-600 border-slate-200",
    OVER_SPEED: "bg-red-50 text-red-700 border-red-200",
    RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
    IDLE: "bg-yellow-50 text-yellow-700 border-yellow-200",
    HALT: "bg-orange-50 text-orange-700 border-orange-200",
    PARKED: "bg-slate-100 text-slate-600 border-slate-200",
    BATTERY_LOW: "bg-red-50 text-red-700 border-red-200",
    GEOFENCE_ENTER: "bg-purple-50 text-purple-700 border-purple-200",
    GEOFENCE_EXIT: "bg-slate-100 text-slate-600 border-slate-200",
}

const vehicleTypeLabel: Record<VehicleAlertType, string> = {
    IGNITION_ON: "Ignition On",
    IGNITION_OFF: "Ignition Off",
    OVER_SPEED: "Over Speed",
    RUNNING: "Running",
    IDLE: "Idle",
    HALT: "Halt",
    PARKED: "Parked",
    BATTERY_LOW: "Battery Low",
    GEOFENCE_ENTER: "Geofence Entered",
    GEOFENCE_EXIT: "Geofence Exited",
}

const vehicleTypeIcon: Record<VehicleAlertType, LucideIcon> = {
    IGNITION_ON: Zap,
    IGNITION_OFF: PowerOff,
    OVER_SPEED: AlertTriangle,
    RUNNING: Activity,
    IDLE: Pause,
    HALT: Pause,
    PARKED: MapPin,
    BATTERY_LOW: BatteryWarning,
    GEOFENCE_ENTER: LogIn,
    GEOFENCE_EXIT: LogOut,
}

const vehicleAccent: Partial<Record<VehicleAlertType, string>> = {
    OVER_SPEED: "#f87171",
    BATTERY_LOW: "#f87171",
    IGNITION_ON: "#4ade80",
}

function formatValue(v: number | null): string {
    if (v == null) return "—"
    return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

type Tab = "trip" | "vehicle"

const TRIP_COLS = "220px 200px 170px minmax(0,1fr)"
const VEHICLE_COLS = "220px 200px 150px 110px minmax(0,1fr)"

export function AlertPanel() {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>("vehicle")

    const [tripAlerts, setTripAlerts] = useState<Alert[]>([])
    const [tripPage, setTripPage] = useState(0)
    const [tripTotalPages, setTripTotalPages] = useState(0)
    const [tripTotalElements, setTripTotalElements] = useState(0)

    const [vehicleAlerts, setVehicleAlerts] = useState<VehicleAlert[]>([])
    const [vehiclePage, setVehiclePage] = useState(0)
    const [vehicleTotalPages, setVehicleTotalPages] = useState(0)
    const [vehicleTotalElements, setVehicleTotalElements] = useState(0)

    const [loading, setLoading] = useState(false)

    // Empty string = no filter (all org vehicles).
    const [vehicleFilter, setVehicleFilter] = useState("")
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    // Per-tab, per-filter, per-page-size cache — revisiting a page already fetched
    // (Prev/Next) for the same vehicle filter and page size reuses the cached result
    // instead of re-calling the API. Only a new page, filter, page size, or an
    // explicit refresh hits the network.
    const tripCacheRef = useRef(new Map<string, { content: Alert[]; totalPages: number; totalElements: number }>())
    const vehicleCacheRef = useRef(new Map<string, { content: VehicleAlert[]; totalPages: number; totalElements: number }>())

    const loadTrip = useCallback(async (p: number, force = false) => {
        const key = `${vehicleFilter}|${pageSize}|${p}`
        if (!force) {
            const cached = tripCacheRef.current.get(key)
            if (cached) {
                setTripAlerts(cached.content)
                setTripTotalPages(cached.totalPages)
                setTripTotalElements(cached.totalElements)
                return
            }
        }
        setLoading(true)
        try {
            const data = await fetchTripAlerts(p, pageSize, vehicleFilter || undefined)
            tripCacheRef.current.set(key, { content: data.content, totalPages: data.totalPages, totalElements: data.totalElements })
            setTripAlerts(data.content)
            setTripTotalPages(data.totalPages)
            setTripTotalElements(data.totalElements)
        } catch (e) {
            console.error("Failed to fetch trip alerts", e)
        } finally {
            setLoading(false)
        }
    }, [vehicleFilter, pageSize])

    const loadVehicle = useCallback(async (p: number, force = false) => {
        const key = `${vehicleFilter}|${pageSize}|${p}`
        if (!force) {
            const cached = vehicleCacheRef.current.get(key)
            if (cached) {
                setVehicleAlerts(cached.content)
                setVehicleTotalPages(cached.totalPages)
                setVehicleTotalElements(cached.totalElements)
                return
            }
        }
        setLoading(true)
        try {
            const data = await fetchVehicleAlerts(p, pageSize, vehicleFilter || undefined)
            vehicleCacheRef.current.set(key, { content: data.content, totalPages: data.totalPages, totalElements: data.totalElements })
            setVehicleAlerts(data.content)
            setVehicleTotalPages(data.totalPages)
            setVehicleTotalElements(data.totalElements)
        } catch (e) {
            console.error("Failed to fetch vehicle alerts", e)
        } finally {
            setLoading(false)
        }
    }, [vehicleFilter, pageSize])

    useEffect(() => {
        if (tab === "trip") loadTrip(tripPage)
    }, [tab, tripPage, loadTrip])

    useEffect(() => {
        if (tab === "vehicle") loadVehicle(vehiclePage)
    }, [tab, vehiclePage, loadVehicle])

    const handleVehicleFilterChange = (v: string) => {
        setVehicleFilter(v)
        setTripPage(0)
        setVehiclePage(0)
    }

    // Deep-link from the Dashboard's vehicle card ("Alerts" button): ?vehicleNo=<no> — this
    // filter is already keyed by vehicleNo (see vehicleOptions below), so no id resolution is
    // needed. Runs once per page load.
    const handledDeepLink = useRef(false)
    useEffect(() => {
        if (handledDeepLink.current) return
        const vehicleNo = new URLSearchParams(window.location.search).get("vehicleNo")
        if (vehicleNo) handleVehicleFilterChange(vehicleNo)
        handledDeepLink.current = true
        router.replace("/alert", { scroll: false })
    }, [])

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setTripPage(0)
        setVehiclePage(0)
    }

    const page = tab === "trip" ? tripPage : vehiclePage
    const setPage = tab === "trip" ? setTripPage : setVehiclePage
    const totalPages = tab === "trip" ? tripTotalPages : vehicleTotalPages
    const totalElements = tab === "trip" ? tripTotalElements : vehicleTotalElements
    const isEmpty = tab === "trip" ? tripAlerts.length === 0 : vehicleAlerts.length === 0

    const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
    const rangeEnd = Math.min(totalElements, (page + 1) * pageSize)

    const vehicleOptions = [
        { label: "All Vehicles", value: "", icon: <Gauge size={14} className="text-slate-400" /> },
        ...vehicles.map((v) => ({
            label: v.name || "Unnamed Vehicle",
            subLabel: v.number,
            value: v.number,
            icon: <Bus size={14} className="text-blue-500" />,
        })),
    ]

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-0 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between pb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Alerts</h2>
                            <p className="text-xs text-slate-400">{totalElements.toLocaleString()} total</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-60">
                            <SearchableSelect
                                options={vehicleOptions}
                                value={vehicleFilter}
                                onChange={handleVehicleFilterChange}
                                placeholder="All vehicles"
                            />
                        </div>
                        <button
                            onClick={() => (tab === "trip" ? loadTrip(tripPage, true) : loadVehicle(vehiclePage, true))}
                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                        </button>
                    </div>
                </div>

                {/* Tabs — segmented control */}
                <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 mb-5">
                    <button
                        onClick={() => setTab("vehicle")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "vehicle"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <Gauge size={15} />
                        Vehicle Alerts
                    </button>
                    <button
                        onClick={() => setTab("trip")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "trip"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <Route size={15} />
                        Trip Alerts
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
                {loading && isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading alerts...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Bell size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No alerts found</p>
                        {vehicleFilter && <p className="text-xs text-slate-400">Try clearing the vehicle filter</p>}
                    </div>
                ) : tab === "trip" ? (
                    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div
                            className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400"
                            style={{ gridTemplateColumns: TRIP_COLS }}
                        >
                            <div className="px-4 py-3 font-semibold">Time</div>
                            <div className="px-4 py-3 font-semibold">Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Type</div>
                            <div className="px-4 py-3 font-semibold">Message</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {tripAlerts.map((a, idx) => {
                                const Icon = tripTypeIcon[a.type]
                                const accent = tripAccent[a.type]
                                return (
                                    <div
                                        key={a.id}
                                        className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                        style={{ gridTemplateColumns: TRIP_COLS, boxShadow: accent ? `inset 3px 0 0 0 ${accent}` : undefined }}
                                    >
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </div>
                                        <div className="px-4 py-3 truncate self-center">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">
                                                {a.vehicleNo}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 self-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${tripTypeStyle[a.type]}`}>
                                                {Icon && <Icon size={11} />}
                                                {tripTypeLabel[a.type] ?? a.type}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-600 text-sm break-words self-center">{a.message}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div
                            className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400"
                            style={{ gridTemplateColumns: VEHICLE_COLS }}
                        >
                            <div className="px-4 py-3 font-semibold">Time</div>
                            <div className="px-4 py-3 font-semibold">Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Type</div>
                            <div className="px-4 py-3 font-semibold">Value</div>
                            <div className="px-4 py-3 font-semibold">Message</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {vehicleAlerts.map((a, idx) => {
                                const Icon = vehicleTypeIcon[a.type]
                                const accent = vehicleAccent[a.type]
                                return (
                                    <div
                                        key={`${a.vehicleNo}-${a.type}-${a.dateTime}`}
                                        className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                        style={{ gridTemplateColumns: VEHICLE_COLS, boxShadow: accent ? `inset 3px 0 0 0 ${accent}` : undefined }}
                                    >
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">
                                            {new Date(a.dateTime).toLocaleString()}
                                        </div>
                                        <div className="px-4 py-3 truncate self-center">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">
                                                {a.vehicleNo}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 self-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${vehicleTypeStyle[a.type]}`}>
                                                {Icon && <Icon size={11} />}
                                                {vehicleTypeLabel[a.type] ?? a.type}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-500 text-sm font-medium truncate self-center">
                                            {formatValue(a.alertValue)}
                                        </div>
                                        <div className="px-4 py-3 text-slate-600 text-sm break-words self-center">{a.message ?? "—"}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination — server-driven: each page change re-fetches `pageSize` alerts from gps_api */}
            <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500">
                        {totalElements === 0 ? (
                            "No results"
                        ) : (
                            <>
                                Showing <span className="font-medium text-slate-700">{rangeStart}–{rangeEnd}</span> of{" "}
                                <span className="font-medium text-slate-700">{totalElements.toLocaleString()}</span>
                            </>
                        )}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="alert-page-size" className="text-xs text-slate-400">Rows</label>
                        <select
                            id="alert-page-size"
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="text-xs border border-slate-200 rounded-lg pl-2 pr-6 py-1 text-slate-600 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                    >
                        <ChevronLeft size={15} />
                        Prev
                    </button>
                    <span className="text-xs text-slate-400 px-1">
                        {totalPages === 0 ? 0 : page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                        disabled={page + 1 >= totalPages || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                    >
                        Next
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    )
}
