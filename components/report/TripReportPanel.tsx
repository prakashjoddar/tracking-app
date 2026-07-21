"use client"

import { useCallback, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { fetchTripReport } from "@/lib/api"
import { TripReportEntry } from "@/lib/types"
import { Route, RefreshCw, PlayCircle, CheckCircle2, Activity } from "lucide-react"
import { toast } from "sonner"
import { ReportFilters } from "./ReportFilters"
import { ReportPagination } from "./ReportPagination"

const STATE_STYLE: Record<TripReportEntry["state"], string> = {
    STARTED: "bg-blue-50 text-blue-700 border-blue-200",
    RUNNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    FINISHED: "bg-green-50 text-green-700 border-green-200",
}

const STATE_ICON = { STARTED: PlayCircle, RUNNING: Activity, FINISHED: CheckCircle2 } as const

const TYPE_STYLE: Record<TripReportEntry["type"], string> = {
    PICKING: "bg-purple-50 text-purple-700 border-purple-200",
    DROPPING: "bg-orange-50 text-orange-700 border-orange-200",
}

const COLS = "160px minmax(0,1fr) 110px 110px 190px 190px 100px"
const DEFAULT_PAGE_SIZE = 25

export function TripReportPanel() {
    const [vehicleNo, setVehicleNo] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")])

    const [entries, setEntries] = useState<TripReportEntry[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)

    const load = useCallback(async (p: number, size: number, from: Dayjs, to: Dayjs, veh: string) => {
        setLoading(true)
        try {
            const data = await fetchTripReport(
                p, size, from.format("YYYY-MM-DDTHH:mm:ss"), to.format("YYYY-MM-DDTHH:mm:ss"), veh || undefined
            )
            setEntries(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load trip report", e)
            toast.error("Failed to load trip report")
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
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 ring-1 ring-green-100">
                        <Route className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Trip Report</h2>
                        <p className="text-xs text-slate-400">Trips including duration and stops visited</p>
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
                        <div className="p-3 bg-slate-50 rounded-full"><Route size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Pick a date range and click Run Report</p>
                    </div>
                ) : loading && isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><Route size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">No trips found for this range</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                            <div className="px-4 py-3 font-semibold">Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Trip</div>
                            <div className="px-4 py-3 font-semibold">Type</div>
                            <div className="px-4 py-3 font-semibold">State</div>
                            <div className="px-4 py-3 font-semibold">Start</div>
                            <div className="px-4 py-3 font-semibold">End</div>
                            <div className="px-4 py-3 font-semibold">Stops</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {entries.map((t, idx) => {
                                const StateIcon = STATE_ICON[t.state]
                                return (
                                    <div
                                        key={t.id}
                                        className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                        style={{ gridTemplateColumns: COLS }}
                                    >
                                        <div className="px-4 py-3 truncate self-center">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{t.vehicleNo}</span>
                                        </div>
                                        <div className="px-4 py-3 text-sm text-slate-800 font-medium truncate self-center">{t.tripName ?? "—"}</div>
                                        <div className="px-4 py-3 self-center">
                                            <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full border ${TYPE_STYLE[t.type]}`}>{t.type}</span>
                                        </div>
                                        <div className="px-4 py-3 self-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${STATE_STYLE[t.state]}`}>
                                                {StateIcon && <StateIcon size={11} />}
                                                {t.state}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">{new Date(t.startTime).toLocaleString()}</div>
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">{t.endTime ? new Date(t.endTime).toLocaleString() : "—"}</div>
                                        <div className="px-4 py-3 text-slate-600 text-sm font-medium self-center">{t.totalStopsVisited}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <ReportPagination
                page={page} pageSize={pageSize} totalPages={totalPages} totalElements={totalElements}
                loading={loading} idPrefix="trip-report"
                onPrev={handlePrev} onNext={handleNext} onPageSizeChange={handlePageSizeChange}
            />
        </div>
    )
}
