"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { Checkbox } from "antd"
import { fetchDaywiseDistanceReport, fetchVehicleGroups } from "@/lib/api"
import { DaywiseDistanceEntry, VehicleGroupEntry } from "@/lib/types"
import { CalendarRange, RefreshCw, Gauge, Download } from "lucide-react"
import { toast } from "sonner"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { ReportFilters } from "./ReportFilters"

const VEHICLE_COL_WIDTH = 160
const DATE_COL_WIDTH = 100

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

export function DaywiseDistanceReportPanel() {
    const orgVehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (orgVehicles.length === 0) fetchVehicles()
    }, [orgVehicles.length, fetchVehicles])

    const [vehicleNo, setVehicleNo] = useState("")
    const [groupId, setGroupId] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")])
    const [fillZero, setFillZero] = useState(false)

    const [groups, setGroups] = useState<VehicleGroupEntry[]>([])
    useEffect(() => {
        fetchVehicleGroups().then(setGroups).catch(() => {})
    }, [])

    const [entries, setEntries] = useState<DaywiseDistanceEntry[]>([])
    const [dates, setDates] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)
    const [exporting, setExporting] = useState(false)

    const load = useCallback(async (from: Dayjs, to: Dayjs, veh: string, grp: string) => {
        setLoading(true)
        try {
            const data = await fetchDaywiseDistanceReport(from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD"), veh || undefined, grp || undefined)
            setEntries(data)
            const days: string[] = []
            for (let d = from.startOf("day"); !d.isAfter(to, "day"); d = d.add(1, "day")) {
                days.push(d.format("YYYY-MM-DD"))
            }
            setDates(days)
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load day-wise distance report", e)
            toast.error("Failed to load day-wise distance report")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRun = () => load(range[0], range[1], vehicleNo, groupId)
    const handleRefresh = () => load(range[0], range[1], vehicleNo, groupId)

    const { vehicles, valueByKey } = useMemo(() => {
        const map = new Map<string, number>()
        const presentVehicles = new Set<string>()
        for (const e of entries) {
            map.set(`${e.vehicleNo}|${e.date}`, e.distanceKm)
            presentVehicles.add(e.vehicleNo)
        }
        const group = groups.find((g) => g.id === groupId)
        let roster: string[]
        if (fillZero) {
            let scoped = group ? orgVehicles.filter((v) => group.vehicleNumbers.includes(v.number)) : orgVehicles
            if (vehicleNo) scoped = scoped.filter((v) => v.number === vehicleNo)
            roster = scoped.map((v) => v.number)
        } else {
            roster = Array.from(presentVehicles)
        }
        return { vehicles: roster.sort(), valueByKey: map }
    }, [entries, fillZero, orgVehicles, vehicleNo, groups, groupId])

    const handleExportCsv = () => {
        setExporting(true)
        try {
            const lines = [["Vehicle Number", ...dates].join(",")]
            for (const v of vehicles) {
                const row = [v, ...dates.map((d) => {
                    const val = valueByKey.get(`${v}|${d}`)
                    return val !== undefined ? val.toFixed(1) : (fillZero ? "0.0" : "")
                })]
                lines.push(row.map((c) => csvEscape(String(c))).join(","))
            }
            downloadCsv(lines.join("\n"), `daywise-distance-report_${range[0].format("YYYY-MM-DD")}_${range[1].format("YYYY-MM-DD")}.csv`)
        } finally {
            setExporting(false)
        }
    }

    const isEmpty = vehicles.length === 0
    const gridTemplateColumns = `${VEHICLE_COL_WIDTH}px repeat(${dates.length}, ${DATE_COL_WIDTH}px)`

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-50 text-pink-600 ring-1 ring-pink-100">
                            <CalendarRange className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Day-wise Distance Report</h2>
                            <p className="text-xs text-slate-400">Distance travelled per vehicle, broken down by day</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox checked={fillZero} onChange={(e) => setFillZero(e.target.checked)}>
                            <span className="text-sm text-slate-600">Fill missing with 0</span>
                        </Checkbox>
                        {hasRun && !isEmpty && (
                            <button
                                onClick={handleExportCsv}
                                disabled={exporting}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 text-sm font-medium shadow-sm disabled:opacity-60"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>
                        )}
                    </div>
                </div>
                <ReportFilters
                    vehicleNo={vehicleNo}
                    onVehicleChange={setVehicleNo}
                    groupId={groupId}
                    onGroupChange={setGroupId}
                    range={range}
                    onRangeChange={setRange}
                    onRun={handleRun}
                    onRefresh={handleRefresh}
                    loading={loading}
                />
            </div>

            <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
                {!hasRun ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><CalendarRange size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Pick a date range and click Run Report</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Gauge size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">No vehicle activity found for this range</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto">
                        <div className="grid" style={{ gridTemplateColumns }}>
                            <div className="sticky top-0 left-0 z-20 px-3 py-3 font-semibold text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-r border-slate-200">
                                Vehicle
                            </div>
                            {dates.map((d) => (
                                <div key={d} className="sticky top-0 z-10 px-2 py-3 text-center font-semibold text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50/80 border-b border-slate-200">
                                    {dayjs(d).format("DD MMM")}
                                </div>
                            ))}

                            {vehicles.map((v, idx) => (
                                <Fragment key={v}>
                                    <div
                                        className={`sticky left-0 z-10 px-3 py-2.5 self-center border-r border-slate-200 ${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                                    >
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{v}</span>
                                    </div>
                                    {dates.map((d) => {
                                        const val = valueByKey.get(`${v}|${d}`)
                                        return (
                                            <div
                                                key={`${v}-${d}`}
                                                className={`px-2 py-2.5 text-center text-sm self-center border-b border-slate-100 last:border-0 ${idx % 2 === 1 ? "bg-slate-50/50" : ""} ${val ? "text-slate-700" : "text-slate-300"}`}
                                            >
                                                {val !== undefined ? val.toFixed(1) : (fillZero ? "0.0" : "–")}
                                            </div>
                                        )
                                    })}
                                </Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
