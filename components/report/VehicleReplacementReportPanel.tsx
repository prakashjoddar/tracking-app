"use client"

import { useCallback, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { fetchVehicleReplacementReport } from "@/lib/api"
import { VehicleReplacementHistoryEntry } from "@/lib/types"
import { ArrowLeftRight, RefreshCw, Car } from "lucide-react"
import { toast } from "sonner"
import { ReportFilters } from "./ReportFilters"
import { ReportPagination } from "./ReportPagination"

const COLS = "180px minmax(0,1fr) minmax(0,1fr) 180px 110px"
const DEFAULT_PAGE_SIZE = 25

const formatDuration = (startedAt: string, endedAt: string | null): string => {
    const end = endedAt ? dayjs(endedAt) : dayjs()
    const minutes = end.diff(dayjs(startedAt), "minute")
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ${minutes % 60}m`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
}

export function VehicleReplacementReportPanel() {
    const [vehicleNo, setVehicleNo] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(30, "day").startOf("day"), dayjs().endOf("day")])

    const [entries, setEntries] = useState<VehicleReplacementHistoryEntry[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)

    const load = useCallback(async (p: number, size: number, from: Dayjs, to: Dayjs, veh: string) => {
        setLoading(true)
        try {
            const data = await fetchVehicleReplacementReport(
                p, size, from.format("YYYY-MM-DDTHH:mm:ss"), to.format("YYYY-MM-DDTHH:mm:ss"), veh || undefined
            )
            setEntries(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load vehicle replacement report", e)
            toast.error("Failed to load vehicle replacement report")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRun = () => { setPage(0); load(0, pageSize, range[0], range[1], vehicleNo) }
    const handleRefresh = () => load(page, pageSize, range[0], range[1], vehicleNo)
    const handlePrev = () => { const np = Math.max(0, page - 1); setPage(np); load(np, pageSize, range[0], range[1], vehicleNo) }
    const handleNext = () => { const np = page + 1 < totalPages ? page + 1 : page; setPage(np); load(np, pageSize, range[0], range[1], vehicleNo) }
    const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(0); load(0, size, range[0], range[1], vehicleNo) }

    const isEmpty = entries.length === 0

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Vehicle Replacement Report</h2>
                        <p className="text-xs text-slate-400">Timeline of vehicle replacements — when a substitute started and stopped covering a vehicle</p>
                    </div>
                </div>
                <ReportFilters
                    vehicleNo={vehicleNo}
                    onVehicleChange={setVehicleNo}
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
                        <div className="p-3 bg-slate-50 rounded-full"><ArrowLeftRight size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Pick a date range and click Run Report</p>
                    </div>
                ) : loading && isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Car size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">No replacements found for this range</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                            <div className="px-4 py-3 font-semibold">Started</div>
                            <div className="px-4 py-3 font-semibold">Damaged Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Replacement Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Ended</div>
                            <div className="px-4 py-3 font-semibold">Duration</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {entries.map((h) => (
                                <div
                                    key={h.id}
                                    className="grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors"
                                    style={{ gridTemplateColumns: COLS }}
                                >
                                    <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">{new Date(h.startedAt).toLocaleString()}</div>
                                    <div className="px-4 py-3 truncate self-center">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{h.damagedVehicleNumber}</span>
                                    </div>
                                    <div className="px-4 py-3 truncate self-center">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{h.replacementVehicleNumber}</span>
                                    </div>
                                    <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">
                                        {h.endedAt ? new Date(h.endedAt).toLocaleString() : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 text-slate-600 text-xs self-center">{formatDuration(h.startedAt, h.endedAt)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ReportPagination
                page={page} pageSize={pageSize} totalPages={totalPages} totalElements={totalElements}
                loading={loading} idPrefix="vehicle-replacement-report"
                onPrev={handlePrev} onNext={handleNext} onPageSizeChange={handlePageSizeChange}
            />
        </div>
    )
}
