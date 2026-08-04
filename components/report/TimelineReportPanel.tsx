"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { DatePicker } from "antd"
import { fetchTimelineReport } from "@/lib/api"
import { TimelineSegment } from "@/lib/types"
import { History, RefreshCw, Bus, MapPin, Clock, Gauge, Route as RouteIcon, Zap } from "lucide-react"
import { toast } from "sonner"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { SearchableSelect } from "@/components/ui/searchable-select"

function formatSegmentTime(iso: string): string {
    return dayjs(iso).format("hh:mm A")
}

function formatDuration(seconds: number | null): string {
    if (seconds == null) return "Ongoing"
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes}min`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}

export function TimelineReportPanel() {
    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const [vehicleId, setVehicleId] = useState("")
    const [date, setDate] = useState<Dayjs>(dayjs())
    const [segments, setSegments] = useState<TimelineSegment[]>([])
    const [loading, setLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId)

    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({
            label: v.name || "Unnamed Vehicle",
            subLabel: v.number,
            value: v.id,
            icon: <Bus size={14} className="text-blue-500" />,
        })),
        [vehicles],
    )

    const load = useCallback(async () => {
        if (!selectedVehicle) return
        setLoading(true)
        try {
            const data = await fetchTimelineReport(selectedVehicle.number, date.format("YYYY-MM-DD"))
            setSegments(data)
            setHasLoaded(true)
        } catch (e) {
            console.error("Failed to load timeline", e)
            toast.error("Failed to load timeline")
        } finally {
            setLoading(false)
        }
    }, [selectedVehicle, date])

    useEffect(() => {
        if (selectedVehicle) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVehicle?.number, date])

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Timeline</h2>
                        <p className="text-xs text-slate-400">A vehicle&apos;s day as alternating stops (ignition off) and trips (ignition on)</p>
                    </div>
                </div>

                <div className="flex items-end gap-2 flex-wrap">
                    <div className="w-60">
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vehicle</label>
                        <SearchableSelect options={vehicleOptions} value={vehicleId} onChange={setVehicleId} placeholder="Select a vehicle" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Date</label>
                        <DatePicker
                            value={date}
                            allowClear={false}
                            disabledDate={(current) => !!current && current > dayjs().endOf("day")}
                            onChange={(d) => d && setDate(d)}
                        />
                    </div>
                    <button
                        onClick={load}
                        disabled={!selectedVehicle || loading}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm disabled:opacity-60"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                {!selectedVehicle ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><History size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Select a vehicle to see its timeline</p>
                    </div>
                ) : loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading timeline...</p>
                    </div>
                ) : hasLoaded && segments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium">No activity recorded for this day</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-w-2xl">
                        {segments.map((seg, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl border shadow-sm px-5 py-4 border-l-4 ${seg.type === "STOP" ? "border-l-red-400" : "border-l-green-400"
                                    }`}
                            >
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${seg.type === "STOP" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                                        }`}
                                >
                                    {seg.type}
                                </span>

                                {seg.type === "STOP" ? (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={15} className="text-red-500 mt-0.5 shrink-0" />
                                            <p className="text-sm text-slate-800">{seg.startAddress}</p>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {formatSegmentTime(seg.startTime)} - {seg.endTime ? formatSegmentTime(seg.endTime) : "ongoing"}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <Clock size={14} className="text-blue-500" />
                                            <span className="text-sm font-semibold text-slate-700">{formatDuration(seg.durationSeconds)}</span>
                                            <span className="text-xs text-slate-400">Duration</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={15} className="text-green-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-800">{seg.startAddress}</p>
                                                <p className="text-xs text-slate-400">{formatSegmentTime(seg.startTime)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin size={15} className="text-red-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm text-slate-800">{seg.endAddress ?? "Ongoing"}</p>
                                                {seg.endTime && <p className="text-xs text-slate-400">{formatSegmentTime(seg.endTime)}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-1 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-blue-500" />
                                                <span className="text-sm font-semibold text-slate-700">{formatDuration(seg.durationSeconds)}</span>
                                                <span className="text-xs text-slate-400">Duration</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RouteIcon size={14} className="text-blue-500" />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {seg.distanceKm != null ? `${seg.distanceKm.toFixed(1)} Km` : "—"}
                                                </span>
                                                <span className="text-xs text-slate-400">Distance</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Gauge size={14} className="text-blue-500" />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {seg.avgSpeedKmh != null ? `${Math.round(seg.avgSpeedKmh)} Kmph` : "—"}
                                                </span>
                                                <span className="text-xs text-slate-400">Avg Speed</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={14} className="text-blue-500" />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {seg.maxSpeedKmh != null ? `${Math.round(seg.maxSpeedKmh)} Kmph` : "—"}
                                                </span>
                                                <span className="text-xs text-slate-400">Max Speed</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
