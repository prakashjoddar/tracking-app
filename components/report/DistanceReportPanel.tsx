"use client"

import { useCallback, useEffect, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { Checkbox } from "antd"
import { fetchDistanceReport, fetchVehicleGroups } from "@/lib/api"
import { DistanceReportEntry, VehicleGroupEntry } from "@/lib/types"
import { Milestone, RefreshCw, Gauge, Download } from "lucide-react"
import { toast } from "sonner"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { ReportFilters } from "./ReportFilters"
import { ReportPagination } from "./ReportPagination"

const COLS = "220px minmax(0,1fr)"
const DEFAULT_PAGE_SIZE = 25

const CSV_HEADERS = ["Vehicle Number", "Distance Travelled (Km)"]

function csvEscape(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(rows: DistanceReportEntry[]): string {
    const lines = [CSV_HEADERS.join(",")]
    for (const e of rows) {
        lines.push([e.vehicleNo, e.distanceKm.toFixed(1)].map((v) => csvEscape(String(v))).join(","))
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

export function DistanceReportPanel() {
    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const [vehicleNo, setVehicleNo] = useState("")
    const [groupId, setGroupId] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")])
    const [fillZero, setFillZero] = useState(false)

    const [groups, setGroups] = useState<VehicleGroupEntry[]>([])
    useEffect(() => {
        fetchVehicleGroups().then(setGroups).catch(() => {})
    }, [])

    const [entries, setEntries] = useState<DistanceReportEntry[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)
    const [exporting, setExporting] = useState(false)

    const fetchAll = async (from: Dayjs, to: Dayjs, veh: string, grp: string): Promise<DistanceReportEntry[]> => {
        const fetchSize = 500
        let all: DistanceReportEntry[] = []
        let p = 0
        while (true) {
            const data = await fetchDistanceReport(
                p, fetchSize, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD"), veh || undefined, grp || undefined
            )
            all = all.concat(data.content)
            if (p + 1 >= data.totalPages) break
            p++
        }
        return all
    }

    /** Unions fetched entries with the full (optionally group/vehicle-filtered) roster, defaulting missing vehicles to 0 distance. */
    const fillZeroRows = (fetched: DistanceReportEntry[], veh: string, grp: string): DistanceReportEntry[] => {
        const byVehicle = new Map(fetched.map((e) => [e.vehicleNo, e.distanceKm]))
        const group = groups.find((g) => g.id === grp)
        let scoped = group ? vehicles.filter((v) => group.vehicleNumbers.includes(v.number)) : vehicles
        if (veh) scoped = scoped.filter((v) => v.number === veh)
        const roster = scoped.map((v) => v.number)
        return roster
            .map((no) => ({ vehicleNo: no, distanceKm: byVehicle.get(no) ?? 0 }))
            .sort((a, b) => a.vehicleNo.localeCompare(b.vehicleNo))
    }

    const load = useCallback(async (p: number, size: number, from: Dayjs, to: Dayjs, veh: string, grp: string, zero: boolean) => {
        setLoading(true)
        try {
            if (zero) {
                const all = fillZeroRows(await fetchAll(from, to, veh, grp), veh, grp)
                setTotalElements(all.length)
                setTotalPages(Math.max(1, Math.ceil(all.length / size)))
                setEntries(all.slice(p * size, p * size + size))
            } else {
                const data = await fetchDistanceReport(
                    p, size, from.format("YYYY-MM-DD"), to.format("YYYY-MM-DD"), veh || undefined, grp || undefined
                )
                setEntries(data.content)
                setTotalPages(data.totalPages)
                setTotalElements(data.totalElements)
            }
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load distance report", e)
            toast.error("Failed to load distance report")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicles, groups])

    const handleRun = () => { setPage(0); load(0, pageSize, range[0], range[1], vehicleNo, groupId, fillZero) }
    const handleRefresh = () => load(page, pageSize, range[0], range[1], vehicleNo, groupId, fillZero)
    const handlePrev = () => { const np = Math.max(0, page - 1); setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId, fillZero) }
    const handleNext = () => { const np = page + 1 < totalPages ? page + 1 : page; setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId, fillZero) }
    const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(0); load(0, size, range[0], range[1], vehicleNo, groupId, fillZero) }

    const handleExportCsv = async () => {
        setExporting(true)
        try {
            const from = range[0], to = range[1]
            let all = await fetchAll(from, to, vehicleNo, groupId)
            if (fillZero) all = fillZeroRows(all, vehicleNo, groupId)
            downloadCsv(toCsv(all), `distance-report_${from.format("YYYY-MM-DD")}_${to.format("YYYY-MM-DD")}.csv`)
        } catch (e) {
            console.error("Failed to export distance report", e)
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
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                            <Milestone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Distance Report</h2>
                            <p className="text-xs text-slate-400">Total distance travelled per vehicle over the selected range</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={fillZero}
                            onChange={(e) => {
                                setFillZero(e.target.checked)
                                if (hasRun) load(0, pageSize, range[0], range[1], vehicleNo, groupId, e.target.checked)
                                setPage(0)
                            }}
                        >
                            <span className="text-sm text-slate-600">Fill missing vehicles with 0</span>
                        </Checkbox>
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
                        <div className="p-3 bg-slate-50 rounded-full"><Milestone size={24} className="text-slate-400" /></div>
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
                        <div className="grid sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                            <div className="px-4 py-3 font-semibold">Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Distance Travelled</div>
                        </div>
                        {entries.map((e, idx) => (
                            <div
                                key={e.vehicleNo}
                                className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                style={{ gridTemplateColumns: COLS }}
                            >
                                <div className="px-4 py-3 truncate self-center">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{e.vehicleNo}</span>
                                </div>
                                <div className="px-4 py-3 text-slate-700 text-sm font-medium self-center">{e.distanceKm.toFixed(1)} Km</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ReportPagination
                page={page} pageSize={pageSize} totalPages={totalPages} totalElements={totalElements}
                loading={loading} idPrefix="distance-report"
                onPrev={handlePrev} onNext={handleNext} onPageSizeChange={handlePageSizeChange}
            />
        </div>
    )
}
