"use client"

import { useHistoryStore } from "@/store/history-store"
import { VehicleHistoryPoint } from "@/lib/types"
import { DatePicker } from "antd"
import { RangePickerProps } from "antd/es/date-picker"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import {
    Play, Pause, SkipBack, SkipForward,
    ChevronLeft, ChevronRight,
    Activity, Clock, Gauge, Satellite,
    Zap, Route, Timer, TrendingUp,
    Search, Loader2, Bus
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { BiSignal1, BiSignal2, BiSignal3, BiSignal4, BiSignal5 } from "react-icons/bi"
import { IoRocketSharp } from "react-icons/io5"
import { LiaSatelliteDishSolid } from "react-icons/lia"
import { SearchableSelect } from "../ui/searchable-select"
import { cn } from "@/lib/utils"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { fetchVehicles, fetchVehicleLocationHistory } from "@/lib/api"
import { toast } from "sonner"

const { RangePicker } = DatePicker

// ── helpers defined outside component ─────────────────────────────────────────

const SignalIcon = ({ value }: { value?: number }) => {
    const cls = "size-3.5"
    if (!value) return <BiSignal1 className={cn(cls, "text-gray-400")} />
    if (value >= 80) return <BiSignal5 className={cn(cls, "text-green-500")} />
    if (value >= 60) return <BiSignal4 className={cn(cls, "text-yellow-500")} />
    if (value >= 40) return <BiSignal3 className={cn(cls, "text-orange-500")} />
    if (value >= 20) return <BiSignal2 className={cn(cls, "text-red-500")} />
    return <BiSignal1 className={cn(cls, "text-gray-400")} />
}

const getSpeedColor = (speed: number): string => {
    if (speed >= 75) return "text-red-600"
    if (speed >= 60) return "text-orange-500"
    if (speed >= 40) return "text-yellow-500"
    if (speed >= 20) return "text-green-500"
    return "text-gray-400"
}

const getSpeedBarColor = (speed: number): string => {
    if (speed >= 75) return "bg-red-600"
    if (speed >= 60) return "bg-orange-500"
    if (speed >= 40) return "bg-yellow-500"
    if (speed >= 20) return "bg-green-500"
    return "bg-gray-300"
}

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type StatCardProps = {
    icon: React.ReactNode
    label: string
    value: string | number
    sub?: string
    accent?: string
}

const StatCard = ({ icon, label, value, sub, accent }: StatCardProps) => (
    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
        <div className={cn("p-1.5 rounded-lg shrink-0", accent ?? "bg-blue-100")}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
)

// ── main component ─────────────────────────────────────────────────────────────

export default function PlaybackPanel() {

    const [vehicle, setVehicle] = useState<string>("")
    const [dateRange, setDateRange] = useState<[string, string] | null>(null)
    const [enableTime, setEnableTime] = useState<boolean>(false)
    const [speed, setSpeed] = useState<number>(1)
    const [loadingHistory, setLoadingHistory] = useState(false)

    const playing = useHistoryStore(s => s.playing)
    const togglePlay = useHistoryStore(s => s.togglePlay)
    const index = useHistoryStore(s => s.index)
    const setIndex = useHistoryStore(s => s.setIndex)
    const points = useHistoryStore(s => s.points)

    const { vehicles, setVehicles, loading: vehiclesLoading, setLoading: setVehiclesLoading } = useVehicleManageStore()

    // ── fetch vehicles ────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            if (vehicles.length > 0) return
            try {
                setVehiclesLoading(true)
                const data = await fetchVehicles()
                setVehicles(data)
            } catch (e) {
                console.error("Failed to load vehicles", e)
            } finally {
                setVehiclesLoading(false)
            }
        }
        load()
    }, [])

    const vehicleOptions = vehicles.map(v => ({
        label: v.name || "Unnamed Vehicle",
        subLabel: v.number,
        value: v.number,
        icon: <Bus size={14} className="text-blue-500" />
    }))

    const p = points[index] as VehicleHistoryPoint | undefined

    // ── derived stats ──────────────────────────────────────────────────────────
    const maxSpeed = points.length ? Math.max(...points.map(pt => pt.speed)) : 0
    const totalPoints = points.length
    const progress = totalPoints > 1 ? (index / (totalPoints - 1)) * 100 : 0

    const runningPoints = points.filter(pt => pt.speed > 0).length
    const idlePoints = totalPoints - runningPoints
    const runningTime = Math.round((runningPoints / Math.max(totalPoints, 1)) * 60 * 60)
    const idleTime = Math.round((idlePoints / Math.max(totalPoints, 1)) * 60 * 60)

    // ── playback ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!playing) return
        const interval = setInterval(() => {
            const cur = useHistoryStore.getState().index
            const len = useHistoryStore.getState().points.length
            if (cur < len - 1) {
                setIndex(cur + 1)
            } else {
                togglePlay()
            }
        }, 400 / speed)
        return () => clearInterval(interval)
    }, [playing, speed])

    const handleFirst = useCallback(() => setIndex(0), [])
    const handleLast = useCallback(() => setIndex(Math.max(0, totalPoints - 1)), [totalPoints])
    const handlePrev = useCallback(() => setIndex(Math.max(0, index - 1)), [index])
    const handleNext = useCallback(() => setIndex(Math.min(totalPoints - 1, index + 1)), [index, totalPoints])

    const disabledDate: RangePickerProps["disabledDate"] = (current) =>
        current && (current > dayjs().endOf("day") || current.year() < 2026)

    const onDateChange = (
        dates: (Dayjs | null)[] | null,
    ) => {
        if (dates && dates[0] && dates[1]) {
            const format = enableTime ? "YYYY-MM-DDTHH:mm:ss" : "YYYY-MM-DD"
            setDateRange([
                dates[0].format(format),
                dates[1].format(format)
            ])
        } else {
            setDateRange(null)
        }
    }

    const handleLoadHistory = async () => {
        if (!vehicle) {
            toast.error("Please select a vehicle.")
            return
        }
        if (!dateRange) {
            toast.error("Please select a date range.")
            return
        }

        try {
            setLoadingHistory(true)
            const pts = await fetchVehicleLocationHistory(vehicle, dateRange[0], dateRange[1])
            if (pts && pts.length > 0) {
                useHistoryStore.getState().setPoints(pts)
                toast.success(`Successfully loaded ${pts.length} history points.`)
            } else {
                toast.error("No movement history found for these dates.")
                useHistoryStore.getState().setPoints([])
            }
        } catch (e: any) {
            console.error("Load failed", e)
            toast.error(e.response?.data?.message || "Failed to load location history.")
        } finally {
            setLoadingHistory(false)
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="shrink-0 px-4 py-3.5 border-b">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Activity size={14} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">Location History</h2>
                        <p className="text-[11px] text-gray-400">Playback & analysis</p>
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {/* Vehicle select */}
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Vehicle
                    </label>
                    <SearchableSelect
                        options={vehicleOptions}
                        value={vehicle}
                        onChange={setVehicle}
                        placeholder={vehiclesLoading ? "Loading vehicles..." : "Select vehicle..."}
                    />
                </div>

                {/* Date range */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                            Date Range
                        </label>
                        <button
                            onClick={() => setEnableTime(v => !v)}
                            className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                                enableTime
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            {enableTime ? "Time ON" : "Time OFF"}
                        </button>
                    </div>
                    <RangePicker
                        className="w-full"
                        disabledDate={disabledDate}
                        showTime={enableTime ? {
                            defaultOpenValue: [dayjs("00:00:00", "HH:mm:ss"), dayjs("23:59:59", "HH:mm:ss")]
                        } : false}
                        onChange={onDateChange}
                    />
                </div>

                {/* Load button */}
                <button
                    onClick={handleLoadHistory}
                    disabled={loadingHistory}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                >
                    {loadingHistory ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {loadingHistory ? "Loading..." : "Load History"}
                </button>

                {/* ── Playback section ───────────────────────────────── */}
                {totalPoints > 0 && (
                    <div className="space-y-4">

                        {/* Timeline */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span>{p ? `${p.date} ${p.time}` : "—"}</span>
                                <span>{index + 1} / {totalPoints}</span>
                            </div>

                            {/* Progress track */}
                            <div className="relative">
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={totalPoints - 1}
                                    value={index}
                                    onChange={e => setIndex(Number(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-2">

                            {/* Nav buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleFirst}
                                    className="size-8 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors"
                                    title="First"
                                >
                                    <SkipBack size={13} className="text-gray-600" />
                                </button>
                                <button
                                    onClick={handlePrev}
                                    disabled={index === 0}
                                    className="size-8 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                    title="Previous"
                                >
                                    <ChevronLeft size={13} className="text-gray-600" />
                                </button>
                            </div>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all",
                                    playing
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                            >
                                {playing
                                    ? <><Pause size={14} /> Pause</>
                                    : <><Play size={14} /> Play</>
                                }
                            </button>

                            {/* Nav buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleNext}
                                    disabled={index >= totalPoints - 1}
                                    className="size-8 flex items-center justify-center rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                    title="Next"
                                >
                                    <ChevronRight size={13} className="text-gray-600" />
                                </button>
                                <button
                                    onClick={handleLast}
                                    className="size-8 flex items-center justify-center rounded-lg border hover:bg-gray-50 transition-colors"
                                    title="Last"
                                >
                                    <SkipForward size={13} className="text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Speed multiplier */}
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-gray-50">
                            <span className="text-xs font-medium text-gray-600">Playback Speed</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSpeed(v => Math.max(v - 1, 1))}
                                    disabled={speed === 1}
                                    className="size-7 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm font-bold"
                                >
                                    −
                                </button>
                                <span className="text-sm font-bold text-blue-600 w-8 text-center">
                                    {speed}×
                                </span>
                                <button
                                    onClick={() => setSpeed(v => Math.min(v + 1, 8))}
                                    disabled={speed === 8}
                                    className="size-7 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* ── Current point stats ──────────────────── */}
                        {p && (
                            <div className="space-y-3">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                    Current Point
                                </p>

                                {/* Speed with bar */}
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Gauge size={13} className="text-gray-400" />
                                            <span className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Speed</span>
                                        </div>
                                        <span className={cn("text-sm font-bold", getSpeedColor(p.speed))}>
                                            {p.speed} km/h
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-200", getSpeedBarColor(p.speed))}
                                            style={{ width: `${Math.min((p.speed / 120) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <StatCard
                                        icon={<IoRocketSharp size={13} className={p.ignition ? "text-green-600" : "text-gray-400"} />}
                                        label="Ignition"
                                        value={p.ignition ? "ON" : "OFF"}
                                        accent={p.ignition ? "bg-green-100" : "bg-gray-100"}
                                    />
                                    <StatCard
                                        icon={<Clock size={13} className="text-blue-600" />}
                                        label="Time"
                                        value={p.time}
                                        sub={p.date}
                                        accent="bg-blue-100"
                                    />
                                    <StatCard
                                        icon={<SignalIcon value={p.signalStrength} />}
                                        label="Signal"
                                        value={`${p.signalStrength}%`}
                                        accent="bg-yellow-100"
                                    />
                                    <StatCard
                                        icon={<LiaSatelliteDishSolid size={13} className="text-purple-600" />}
                                        label="Satellites"
                                        value={p.noOfSatellites}
                                        accent="bg-purple-100"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Trip summary ─────────────────────────── */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                Trip Summary
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <StatCard
                                    icon={<TrendingUp size={13} className="text-red-600" />}
                                    label="Max Speed"
                                    value={`${maxSpeed} km/h`}
                                    accent="bg-red-100"
                                />
                                <StatCard
                                    icon={<Activity size={13} className="text-blue-600" />}
                                    label="Total Points"
                                    value={totalPoints}
                                    accent="bg-blue-100"
                                />
                                <StatCard
                                    icon={<Zap size={13} className="text-green-600" />}
                                    label="Running Time"
                                    value={formatDuration(runningTime)}
                                    accent="bg-green-100"
                                />
                                <StatCard
                                    icon={<Timer size={13} className="text-orange-600" />}
                                    label="Idle Time"
                                    value={formatDuration(idleTime)}
                                    accent="bg-orange-100"
                                />
                            </div>
                        </div>

                    </div>
                )}

                {/* Empty state */}
                {totalPoints === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <Route size={22} />
                        </div>
                        <p className="text-sm font-medium">No history loaded</p>
                        <p className="text-[11px] text-center">
                            Select a vehicle and date range,<br />then click Load History
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}