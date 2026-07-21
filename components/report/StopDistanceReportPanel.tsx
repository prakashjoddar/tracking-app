"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchStops, fetchTrips } from "@/lib/api"
import { Stop, Trip } from "@/lib/types"
import { Signpost, RefreshCw, Gauge, Download, Bus, Route as RouteIcon, Search, Map as MapIcon, Table2 } from "lucide-react"
import { toast } from "sonner"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { GoogleMap, useLoadScript, Polyline } from "@react-google-maps/api"

type StopDistanceRow = {
    sequence: number
    name: string
    distanceKm: number
    latitude: number
    longitude: number
}

const COLS = "90px minmax(0,1fr) 180px"

// Must be a stable reference — a new array literal on every render makes
// useLoadScript think the requested libraries changed and reload the script.
const MAP_LIBRARIES: ("marker" | "geometry")[] = ["marker", "geometry"]

function buildStopMarkerContent(sequence: number, name: string, distanceKm: number, isStart: boolean): HTMLElement {
    const wrapper = document.createElement("div")
    wrapper.style.cssText = "position: relative; display: flex; flex-direction: column; align-items: center;"

    const tooltip = document.createElement("div")
    tooltip.textContent = name
    tooltip.style.cssText = `
        position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.75); color: white; font-size: 11px; font-weight: 500;
        padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none;
        opacity: 0; transition: opacity 0.15s ease;
    `
    const caret = document.createElement("div")
    caret.style.cssText = `
        position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
        border: 4px solid transparent; border-top-color: rgba(0,0,0,0.75);
        pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
    `

    const pin = new google.maps.marker.PinElement({
        background: isStart ? "#16a34a" : "#2563eb",
        borderColor: isStart ? "#15803d" : "#1d4ed8",
        glyph: String(sequence),
        glyphColor: "#fff",
    })

    const distanceBadge = document.createElement("div")
    distanceBadge.textContent = isStart ? "Start" : `${distanceKm.toFixed(2)} km`
    distanceBadge.style.cssText = `
        margin-top: 2px; background: white; color: #334155; font-size: 10px; font-weight: 600;
        padding: 1px 6px; border-radius: 999px; border: 1px solid #cbd5e1; white-space: nowrap;
        box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    `

    wrapper.appendChild(tooltip)
    wrapper.appendChild(caret)
    wrapper.appendChild(pin.element)
    wrapper.appendChild(distanceBadge)

    wrapper.addEventListener("mouseover", () => { tooltip.style.opacity = "1"; caret.style.opacity = "1" })
    wrapper.addEventListener("mouseout", () => { tooltip.style.opacity = "0"; caret.style.opacity = "0" })

    return wrapper
}

function StopDistanceMap({ rows, waypoint }: { rows: StopDistanceRow[]; waypoint?: string | null }) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: MAP_LIBRARIES,
    })

    // Tracked as state (not a plain ref) so the marker effect below is
    // guaranteed to re-run once the map actually becomes available — GoogleMap's
    // onLoad can fire after this component's effects have already committed,
    // and a ref mutation alone wouldn't schedule a re-run.
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

    const onMapLoad = useCallback((m: google.maps.Map) => { setMap(m) }, [])

    // The trip's actual (road-following) route — same encoded polyline drawn on /trip/stop.
    const routePath = useMemo(
        () => (isLoaded && waypoint ? google.maps.geometry.encoding.decodePath(waypoint) : []),
        [isLoaded, waypoint],
    )

    useEffect(() => {
        if (!map) return

        markersRef.current.forEach((m) => { m.map = null })
        markersRef.current = rows.map((r) => new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: r.latitude, lng: r.longitude },
            content: buildStopMarkerContent(r.sequence, r.name, r.distanceKm, r.distanceKm === 0),
        }))

        const bounds = new google.maps.LatLngBounds()
        rows.forEach((r) => bounds.extend({ lat: r.latitude, lng: r.longitude }))
        routePath.forEach((p) => bounds.extend(p))
        if (!bounds.isEmpty()) map.fitBounds(bounds, 60)

        return () => {
            markersRef.current.forEach((m) => { m.map = null })
            markersRef.current = []
        }
    }, [map, rows, routePath])

    const center = rows[0] ? { lat: rows[0].latitude, lng: rows[0].longitude } : { lat: 0, lng: 0 }

    if (!isLoaded) {
        return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading map...</div>
    }

    return (
        <GoogleMap
            onLoad={onMapLoad}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={13}
            options={{ mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID }}
        >
            {routePath.length > 1 && <Polyline path={routePath} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />}
        </GoogleMap>
    )
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
}

function buildRows(stops: Stop[]): StopDistanceRow[] {
    const sorted = [...stops].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    let cumulativeM = 0
    return sorted.map((s, idx) => {
        if (idx > 0) {
            const prev = sorted[idx - 1]
            cumulativeM += haversineMeters(prev.latitude, prev.longitude, s.latitude, s.longitude)
        }
        return {
            sequence: s.sequence ?? idx, name: s.name, distanceKm: cumulativeM / 1000,
            latitude: s.latitude, longitude: s.longitude,
        }
    })
}

function csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function StopDistanceReportPanel() {
    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const [vehicleId, setVehicleId] = useState("")
    const [trips, setTrips] = useState<Trip[]>([])
    const [tripId, setTripId] = useState("")
    const [loadingTrips, setLoadingTrips] = useState(false)

    const [rows, setRows] = useState<StopDistanceRow[]>([])
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)
    const [viewMode, setViewMode] = useState<"table" | "map">("table")

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

    const handleVehicleChange = useCallback(async (id: string) => {
        setVehicleId(id)
        setTripId("")
        setTrips([])
        setRows([])
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

    const handleRun = useCallback(async () => {
        if (!tripId) return
        setLoading(true)
        try {
            const stops = await fetchStops(tripId)
            setRows(buildRows(stops))
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load stop distance report", e)
            toast.error("Failed to load stop distance report")
        } finally {
            setLoading(false)
        }
    }, [tripId])

    const handleExportCsv = () => {
        const lines = [["Sequence", "Stop Name", "Distance From Start (Km)"].join(",")]
        for (const r of rows) {
            lines.push([r.sequence, r.name, r.distanceKm.toFixed(2)].map((v) => csvEscape(String(v))).join(","))
        }
        const trip = trips.find((t) => t.id === tripId)
        downloadCsv(lines.join("\n"), `stop-distance-report_${trip?.name ?? tripId}.csv`)
    }

    const isEmpty = rows.length === 0
    const selectedTrip = trips.find((t) => t.id === tripId)

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                            <Signpost className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Stop Distance Report</h2>
                            <p className="text-xs text-slate-400">Distance of each stop from the trip&apos;s starting location</p>
                        </div>
                    </div>
                    {hasRun && !isEmpty && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode((m) => (m === "table" ? "map" : "table"))}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 text-sm font-medium shadow-sm"
                            >
                                {viewMode === "table" ? <MapIcon size={14} /> : <Table2 size={14} />}
                                {viewMode === "table" ? "Show in Map" : "Show in Table"}
                            </button>
                            <button
                                onClick={handleExportCsv}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 text-sm font-medium shadow-sm"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>
                        </div>
                    )}
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
                            onChange={setTripId}
                            placeholder={loadingTrips ? "Loading trips..." : "Select a trip"}
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
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
                {!hasRun ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Signpost size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Select a vehicle and trip, then click Run Report</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Gauge size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">This trip has no stops defined</p>
                    </div>
                ) : viewMode === "map" ? (
                    <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <StopDistanceMap rows={rows} waypoint={selectedTrip?.waypoint} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto">
                        <div className="grid sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                            <div className="px-4 py-3 font-semibold">Seq</div>
                            <div className="px-4 py-3 font-semibold">Stop Name</div>
                            <div className="px-4 py-3 font-semibold">Distance From Start</div>
                        </div>
                        {rows.map((r, idx) => (
                            <div
                                key={`${r.sequence}-${r.name}`}
                                className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                style={{ gridTemplateColumns: COLS }}
                            >
                                <div className="px-4 py-3 text-slate-500 text-sm self-center">{r.sequence}</div>
                                <div className="px-4 py-3 text-slate-700 text-sm font-medium truncate self-center">{r.name}</div>
                                <div className="px-4 py-3 text-slate-700 text-sm self-center">
                                    {idx === 0 ? (
                                        <span className="text-slate-400">Start (0.0 Km)</span>
                                    ) : (
                                        `${r.distanceKm.toFixed(2)} Km`
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
