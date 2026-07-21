"use client"

import { useCallback, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { fetchVehicleReport } from "@/lib/api"
import { VehicleReportEntry } from "@/lib/types"
import { Car, RefreshCw, Gauge, Download } from "lucide-react"
import { toast } from "sonner"
import { ReportFilters } from "./ReportFilters"
import { ReportPagination } from "./ReportPagination"

const COLS = "110px 140px 120px 110px 100px 110px 120px 120px 110px"
const DEFAULT_PAGE_SIZE = 25

function formatHrMin(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}h ${m}m`
}

const CSV_HEADERS = [
    "Date", "Vehicle Number", "Distance Travelled (Km)", "Running Time (Hr:Min)",
    "Idle Time (Hr:Min)", "Parked Time (Hr:Min)", "Over Speed Percent", "Max Speed (Km/hr)", "Speed Limit (Km/hr)",
]

function csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(rows: VehicleReportEntry[]): string {
    const lines = [CSV_HEADERS.join(",")]
    for (const e of rows) {
        lines.push([
            e.date, e.vehicleNo, e.distanceKm.toFixed(1), formatHrMin(e.runningMinutes),
            formatHrMin(e.idleMinutes), formatHrMin(e.parkedMinutes), `${e.overSpeedPercent.toFixed(1)}%`,
            e.maxSpeedKmh.toFixed(0), e.speedLimitKmh.toFixed(0),
        ].map((v) => csvEscape(String(v))).join(","))
    }
    return lines.join("\n")
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

export function VehicleReportPanel() {
    const [vehicleNo, setVehicleNo] = useState("")
    const [groupId, setGroupId] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")])

    const [entries, setEntries] = useState<VehicleReportEntry[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)
    const [exporting, setExporting] = useState(false)

    const load = useCallback(async (p: number, size: number, from: Dayjs, to: Dayjs, veh: string, grp: string) => {
        setLoading(true)
        try {
            const data = await fetchVehicleReport(
                p, size, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD"), veh || undefined, grp || undefined
            )
            setEntries(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load vehicle report", e)
            toast.error("Failed to load vehicle report")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRun = () => { setPage(0); load(0, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handleRefresh = () => load(page, pageSize, range[0], range[1], vehicleNo, groupId)
    const handlePrev = () => { const np = Math.max(0, page - 1); setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handleNext = () => { const np = page + 1 < totalPages ? page + 1 : page; setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(0); load(0, size, range[0], range[1], vehicleNo, groupId) }

    const handleExportCsv = async () => {
        setExporting(true)
        try {
            const from = range[0], to = range[1]
            const exportSize = 500
            let all: VehicleReportEntry[] = []
            let p = 0
            while (true) {
                const data = await fetchVehicleReport(
                    p, exportSize, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD"), vehicleNo || undefined, groupId || undefined
                )
                all = all.concat(data.content)
                if (p + 1 >= data.totalPages) break
                p++
            }
            downloadCsv(toCsv(all), `vehicle-report_${from.format("YYYY-MM-DD")}_${to.format("YYYY-MM-DD")}.csv`)
        } catch (e) {
            console.error("Failed to export vehicle report", e)
            toast.error("Failed to export CSV")
        } finally {
            setExporting(false)
        }
    }

    const isEmpty = entries.length === 0

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Car className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Vehicle Report</h2>
                            <p className="text-xs text-slate-400">Daily distance, running/idle/parked time, and speed per vehicle</p>
                        </div>
                    </div>
                    {hasRun && (
                        <button
                            onClick={handleExportCsv}
                            disabled={exporting}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 text-sm font-medium shadow-sm disabled:opacity-60"
                        >
                            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                            Export CSV
                        </button>
                    )}
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
                        <div className="p-3 bg-slate-50 rounded-full"><Car size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Pick a date range and click Run Report</p>
                    </div>
                ) : loading && isEmpty ? (
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
                        <div className="min-w-[1040px]">
                            <div className="grid sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                                <div className="px-3 py-3 font-semibold">Date</div>
                                <div className="px-3 py-3 font-semibold">Vehicle</div>
                                <div className="px-3 py-3 font-semibold">Distance</div>
                                <div className="px-3 py-3 font-semibold">Running</div>
                                <div className="px-3 py-3 font-semibold">Idle</div>
                                <div className="px-3 py-3 font-semibold">Parked</div>
                                <div className="px-3 py-3 font-semibold">Over Speed %</div>
                                <div className="px-3 py-3 font-semibold">Max Speed</div>
                                <div className="px-3 py-3 font-semibold">Speed Limit</div>
                            </div>
                            {entries.map((e, idx) => (
                                <div
                                    key={`${e.vehicleNo}-${e.date}`}
                                    className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                    style={{ gridTemplateColumns: COLS }}
                                >
                                    <div className="px-3 py-3 text-slate-500 text-xs truncate self-center">{e.date}</div>
                                    <div className="px-3 py-3 truncate self-center">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{e.vehicleNo}</span>
                                    </div>
                                    <div className="px-3 py-3 text-slate-700 text-sm self-center">{e.distanceKm.toFixed(1)} Km</div>
                                    <div className="px-3 py-3 text-slate-700 text-sm self-center">{formatHrMin(e.runningMinutes)}</div>
                                    <div className="px-3 py-3 text-slate-700 text-sm self-center">{formatHrMin(e.idleMinutes)}</div>
                                    <div className="px-3 py-3 text-slate-700 text-sm self-center">{formatHrMin(e.parkedMinutes)}</div>
                                    <div className="px-3 py-3 self-center">
                                        <span className={`text-xs font-semibold ${e.overSpeedPercent > 0 ? "text-red-600" : "text-slate-400"}`}>
                                            {e.overSpeedPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 text-slate-700 text-sm self-center">{e.maxSpeedKmh.toFixed(0)} Km/hr</div>
                                    <div className="px-3 py-3 text-slate-500 text-sm self-center">{e.speedLimitKmh.toFixed(0)} Km/hr</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ReportPagination
                page={page} pageSize={pageSize} totalPages={totalPages} totalElements={totalElements}
                loading={loading} idPrefix="vehicle-report"
                onPrev={handlePrev} onNext={handleNext} onPageSizeChange={handlePageSizeChange}
            />
        </div>
    )
}
