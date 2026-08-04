"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { DatePicker } from "antd"
import { fetchTrips, fetchTripReport, fetchVehicleLocationHistory } from "@/lib/api"
import { decodeEncodedPolyline } from "@/lib/polyline-decode"
import { haversineMeters, nearestDistanceMeters } from "@/lib/geo"
import { Trip, TripReportEntry, VehicleHistoryPoint } from "@/lib/types"
import { Navigation, RefreshCw, Gauge, Bus, Route as RouteIcon, Search } from "lucide-react"
import { toast } from "sonner"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { useCurrentUserStore } from "@/store/current-user-store"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { RouteDeviationMapEngine } from "./RouteDeviationMapEngine"

const DEFAULT_THRESHOLD_M = 100

export function RouteDeviationReportPanel() {
    const mapProvider = useCurrentUserStore((s) => s.user?.mapProvider) === "MAPLIBRE" ? "maplibre" : "google"
    const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce)
    useEffect(() => { fetchCurrentUserOnce() }, [fetchCurrentUserOnce])

    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const [vehicleId, setVehicleId] = useState("")
    const [trips, setTrips] = useState<Trip[]>([])
    const [tripId, setTripId] = useState("")
    const [loadingTrips, setLoadingTrips] = useState(false)
    const [date, setDate] = useState<Dayjs>(dayjs())

    const [runs, setRuns] = useState<TripReportEntry[]>([])
    const [runId, setRunId] = useState<number | null>(null)
    const [actualPoints, setActualPoints] = useState<VehicleHistoryPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD_M)

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
    const selectedTrip = trips.find((t) => t.id === tripId)

    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({
            label: v.name || "Unnamed Vehicle",
            subLabel: v.number,
            value: v.id,
            icon: <Bus size={14} className="text-blue-500" />,
        })),
        [vehicles],
    )

    const tripOptions = useMemo(
        () => trips.map((t) => ({
            label: t.name,
            subLabel: `${t.type} · ${t.stopCount ?? 0} stops`,
            value: t.id,
            icon: <RouteIcon size={14} className="text-green-500" />,
        })),
        [trips],
    )

    const runOptions = useMemo(
        () => runs.map((r) => ({
            label: `${dayjs(r.startTime).format("HH:mm")} – ${r.endTime ? dayjs(r.endTime).format("HH:mm") : "in progress"}`,
            value: String(r.id),
        })),
        [runs],
    )

    const handleVehicleChange = useCallback(async (id: string) => {
        setVehicleId(id)
        setTripId("")
        setTrips([])
        setRuns([])
        setRunId(null)
        setActualPoints([])
        setHasRun(false)
        if (!id) return
        setLoadingTrips(true)
        try {
            const data = await fetchTrips(id)
            setTrips(data)
        } catch (e) {
            console.error("Failed to load trips", e)
            toast.error("Failed to load trips for this vehicle")
        } finally {
            setLoadingTrips(false)
        }
    }, [])

    const handleTripChange = (id: string) => {
        setTripId(id)
        setRuns([])
        setRunId(null)
        setActualPoints([])
        setHasRun(false)
    }

    const loadRun = useCallback(async (run: TripReportEntry, vehicleNo: string) => {
        setLoading(true)
        try {
            const points = await fetchVehicleLocationHistory(vehicleNo, run.startTime, run.endTime ?? run.startTime)
            setActualPoints(points)
            setRunId(run.id)
        } catch (e) {
            console.error("Failed to load location history", e)
            toast.error("Failed to load actual GPS path")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRun = useCallback(async () => {
        if (!selectedVehicle || !selectedTrip) return
        setLoading(true)
        setRuns([])
        setRunId(null)
        setActualPoints([])
        try {
            const dayStart = date.startOf("day").format("YYYY-MM-DDTHH:mm:ss")
            const dayEnd = date.endOf("day").format("YYYY-MM-DDTHH:mm:ss")
            const data = await fetchTripReport(0, 25, dayStart, dayEnd, selectedVehicle.number)
            const matches = data.content.filter((e) => e.tripId === Number(selectedTrip.id))
            setRuns(matches)
            setHasRun(true)
            if (matches.length === 0) {
                toast.error("No run of this trip found on this date")
                setLoading(false)
                return
            }
            if (matches.length === 1) {
                await loadRun(matches[0], selectedVehicle.number)
            } else {
                setLoading(false)
            }
        } catch (e) {
            console.error("Failed to load trip runs", e)
            toast.error("Failed to load trip runs")
            setLoading(false)
        }
    }, [selectedVehicle, selectedTrip, date, loadRun])

    const handleRunSelect = (id: string) => {
        const run = runs.find((r) => String(r.id) === id)
        if (run && selectedVehicle) loadRun(run, selectedVehicle.number)
    }

    const { plannedPath, actualPath, deviatedIndices, summary } = useMemo(() => {
        if (!selectedTrip?.waypoint || actualPoints.length === 0) {
            return {
                plannedPath: [] as [number, number][],
                actualPath: [] as [number, number][],
                deviatedIndices: new Set<number>(),
                summary: null as null | { totalDistanceKm: number; maxDeviationM: number; percentDeviated: number; events: number },
            }
        }

        const planned = decodeEncodedPolyline(selectedTrip.waypoint)
        const actual: [number, number][] = actualPoints.map((p) => [p.longitude, p.latitude])

        let totalDistanceM = 0
        let maxDeviationM = 0
        const deviated = new Set<number>()
        let events = 0
        let inEvent = false

        actual.forEach((pt, idx) => {
            if (idx > 0) totalDistanceM += haversineMeters(actual[idx - 1][1], actual[idx - 1][0], pt[1], pt[0])
            const dist = planned.length > 0 ? nearestDistanceMeters(pt, planned) : 0
            if (dist > maxDeviationM) maxDeviationM = dist
            if (dist > threshold) {
                deviated.add(idx)
                if (!inEvent) { events++; inEvent = true }
            } else {
                inEvent = false
            }
        })

        return {
            plannedPath: planned,
            actualPath: actual,
            deviatedIndices: deviated,
            summary: {
                totalDistanceKm: totalDistanceM / 1000,
                maxDeviationM,
                percentDeviated: actual.length ? (deviated.size / actual.length) * 100 : 0,
                events,
            },
        }
    }, [selectedTrip?.waypoint, actualPoints, threshold])

    const needsRunPick = hasRun && runs.length > 1 && runId === null
    const noWaypoint = hasRun && !!selectedTrip && !selectedTrip.waypoint && runs.length > 0
    const showMap = actualPath.length > 0 && !needsRunPick

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                        <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Trip Route Deviation</h2>
                        <p className="text-xs text-slate-400">Compare a day&apos;s actual GPS path against the trip&apos;s planned route</p>
                    </div>
                </div>

                <div className="flex items-end gap-2 flex-wrap">
                    <div className="w-60">
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vehicle</label>
                        <SearchableSelect options={vehicleOptions} value={vehicleId} onChange={handleVehicleChange} placeholder="Select a vehicle" />
                    </div>
                    <div className="w-64">
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Trip</label>
                        <SearchableSelect
                            options={tripOptions}
                            value={tripId}
                            onChange={handleTripChange}
                            placeholder={loadingTrips ? "Loading trips..." : "Select a trip"}
                        />
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
                        onClick={handleRun}
                        disabled={!tripId || loading}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                    >
                        <Search size={14} />
                        Run Report
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={!tripId || loading}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm disabled:opacity-60"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                    </button>

                    {showMap && (
                        <div className="flex items-end gap-2 ml-auto">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Deviation Threshold (m)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={threshold}
                                    onChange={(e) => setThreshold(Math.max(1, Number(e.target.value) || DEFAULT_THRESHOLD_M))}
                                    className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {needsRunPick && (
                    <div className="w-72">
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            This trip ran {runs.length} times that day — pick a run
                        </label>
                        <SearchableSelect options={runOptions} onChange={handleRunSelect} placeholder="Select a run" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col px-6 py-4 gap-4">
                {!hasRun ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Navigation size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Select a vehicle, trip, and date, then click Run Report</p>
                    </div>
                ) : loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : runs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Gauge size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">No run of this trip found on this date</p>
                    </div>
                ) : needsRunPick ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium">Pick a run above to continue</p>
                    </div>
                ) : noWaypoint ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-medium">This trip has no planned route configured yet</p>
                    </div>
                ) : (
                    <>
                        {summary && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Actual Distance</p>
                                    <p className="text-lg font-bold text-slate-800">{summary.totalDistanceKm.toFixed(1)} Km</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Max Deviation</p>
                                    <p className="text-lg font-bold text-slate-800">{summary.maxDeviationM.toFixed(0)} m</p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Points Deviated</p>
                                    <p className={`text-lg font-bold ${summary.percentDeviated > 0 ? "text-red-600" : "text-slate-800"}`}>
                                        {summary.percentDeviated.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Deviation Events</p>
                                    <p className={`text-lg font-bold ${summary.events > 0 ? "text-red-600" : "text-slate-800"}`}>{summary.events}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <RouteDeviationMapEngine
                                provider={mapProvider}
                                plannedPath={plannedPath}
                                actualPath={actualPath}
                                deviatedIndices={deviatedIndices}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
