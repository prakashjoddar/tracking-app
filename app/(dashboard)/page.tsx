"use client"

import { useEffect, useState } from "react"
import { fetchDashboardSummary, fetchTopRunningVehicles } from "@/lib/api"
import { DashboardSummaryResponse, DashboardWindow, VehicleLocation } from "@/lib/types"
import { useCurrentUserStore } from "@/store/current-user-store"
import { VehicleMiniMapEngine } from "@/components/dashboard-widgets/VehicleMiniMapEngine"
import {
    LayoutDashboard, Route as RouteIcon, Gauge, Signpost, RefreshCw,
    TrendingUp, MapPin, Navigation, Activity, AlertTriangle,
} from "lucide-react"

const LIVE_POLL_MS = 30000

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5 flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${accent}`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
                <p className="text-lg font-bold text-slate-800 leading-tight truncate">{value}</p>
            </div>
        </div>
    )
}

function RankList({ title, icon, entries, unit }: { title: string; icon: React.ReactNode; entries: { vehicleNo: string; value: number }[]; unit: string }) {
    const safeEntries = entries ?? []
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>
            {safeEntries.length === 0 ? (
                <p className="text-xs text-slate-400">No data yet</p>
            ) : (
                <div className="space-y-2">
                    {safeEntries.map((e, idx) => (
                        <div key={`${e.vehicleNo}-${idx}`} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold shrink-0">{idx + 1}</span>
                                <span className="font-mono text-xs font-medium text-slate-700 truncate">{e.vehicleNo}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 shrink-0">{e.value.toFixed(1)}{unit}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function WindowSection({ title, subtitle, data }: { title: string; subtitle: string; data: DashboardWindow }) {
    return (
        <div className="space-y-3">
            <div>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-400">{subtitle}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile icon={<RouteIcon size={18} className="text-blue-600" />} label="Total Distance" value={`${data.totalDistanceKm.toFixed(1)} Km`} accent="bg-blue-50" />
                <StatTile icon={<Navigation size={18} className="text-green-600" />} label="Trip Completion" value={`${data.tripCompletionPct.toFixed(1)}%`} accent="bg-green-50" />
                <StatTile icon={<MapPin size={18} className="text-amber-600" />} label="Stop Completion" value={`${data.stopCompletionPct.toFixed(1)}%`} accent="bg-amber-50" />
                <StatTile icon={<Gauge size={18} className="text-red-600" />} label="Route Deviation" value={`${data.routeDeviationPct.toFixed(1)}%`} accent="bg-red-50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RankList title="Top Running Vehicles" icon={<TrendingUp size={16} className="text-blue-500" />} entries={data.topRunningVehicles} unit=" Km" />
                <RankList title="Most Utilized" icon={<Activity size={16} className="text-emerald-500" />} entries={data.mostUtilized} unit="%" />
                <RankList title="Needs Attention" icon={<AlertTriangle size={16} className="text-red-500" />} entries={data.needsAttention} unit=" alerts" />
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const mapProvider = useCurrentUserStore((s) => s.user?.mapProvider) === "MAPLIBRE" ? "maplibre" : "google"
    const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce)
    useEffect(() => { fetchCurrentUserOnce() }, [fetchCurrentUserOnce])

    const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
    const [loadingSummary, setLoadingSummary] = useState(true)
    const [summaryError, setSummaryError] = useState(false)

    useEffect(() => {
        let cancelled = false
        fetchDashboardSummary()
            .then((data) => { if (!cancelled) setSummary(data) })
            .catch((e) => {
                console.error("Failed to load dashboard summary", e)
                if (!cancelled) setSummaryError(true)
            })
            .finally(() => { if (!cancelled) setLoadingSummary(false) })
        return () => { cancelled = true }
    }, [])

    // Deliberately its own 30s poll against a dedicated, already-truncated-to-3 endpoint — not
    // the fleet-wide useVehicleLocations/useVehicleStore hook the Live Fleet page polls every 8s.
    const [liveVehicles, setLiveVehicles] = useState<VehicleLocation[]>([])
    const [selectedVehicleNo, setSelectedVehicleNo] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        function load() {
            fetchTopRunningVehicles(3)
                .then((data) => {
                    if (cancelled) return
                    setLiveVehicles(data)
                    setSelectedVehicleNo((prev) => (prev && data.some((v) => v.vehicleNo === prev) ? prev : (data[0]?.vehicleNo ?? null)))
                })
                .catch((e) => console.error("Failed to load top running vehicles", e))
        }
        load()
        const interval = setInterval(load, LIVE_POLL_MS)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [])

    const selectedVehicle = liveVehicles.find((v) => v.vehicleNo === selectedVehicleNo) ?? null

    return (
        <div className="flex h-full overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Dashboard</h1>
                        <p className="text-xs text-slate-400">Fleet performance, computed nightly — nothing here is calculated live</p>
                    </div>
                </div>

                {loadingSummary ? (
                    <div className="flex items-center justify-center h-40 gap-2 text-slate-400">
                        <RefreshCw size={20} className="animate-spin" />
                        <span className="text-sm font-medium">Loading dashboard...</span>
                    </div>
                ) : summaryError || !summary ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Signpost size={24} />
                        <p className="text-sm font-medium">Could not load dashboard stats</p>
                    </div>
                ) : (
                    <>
                        <WindowSection title="This Month" subtitle="1st of this month through yesterday" data={summary.month} />
                        <WindowSection title="Yesterday" subtitle="Previous calendar day" data={summary.yesterday} />
                    </>
                )}
            </div>

            <div className="w-[380px] shrink-0 border-l border-slate-200 flex flex-col h-full bg-white">
                <div className="h-1/2 min-h-0 overflow-y-auto p-4 space-y-2 border-b border-slate-200">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Running Now</h2>
                    {liveVehicles.length === 0 ? (
                        <p className="text-sm text-slate-400">No vehicles currently running</p>
                    ) : (
                        liveVehicles.map((v, idx) => (
                            <button
                                key={`${v.vehicleNo}-${idx}`}
                                onClick={() => setSelectedVehicleNo(v.vehicleNo)}
                                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${selectedVehicleNo === v.vehicleNo ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                            >
                                <p className="text-sm font-semibold text-slate-800 truncate">{v.label || v.vehicleNo}</p>
                                <p className="text-xs text-slate-400">{Math.round(v.speed)} Km/h</p>
                            </button>
                        ))
                    )}
                </div>
                <div className="h-1/2 min-h-0">
                    <VehicleMiniMapEngine vehicle={selectedVehicle} provider={mapProvider} />
                </div>
            </div>
        </div>
    )
}
