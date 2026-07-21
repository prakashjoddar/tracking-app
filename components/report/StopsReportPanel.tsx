"use client"

import { useCallback, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import { fetchStopsReport } from "@/lib/api"
import { Alert } from "@/lib/types"
import { MapPin, RefreshCw, MapPinCheck, ArrowRightCircle, AlertTriangle, Navigation, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { ReportFilters } from "./ReportFilters"
import { ReportPagination } from "./ReportPagination"

type StopAlertType = "BUS_APPROACHING_STOP" | "BUS_ARRIVED_AT_STOP" | "BUS_DEPARTED_STOP" | "STOP_SKIPPED_MISSED"

const TYPE_STYLE: Record<StopAlertType, string> = {
    BUS_APPROACHING_STOP: "bg-amber-50 text-amber-700 border-amber-200",
    BUS_ARRIVED_AT_STOP: "bg-blue-50 text-blue-700 border-blue-200",
    BUS_DEPARTED_STOP: "bg-purple-50 text-purple-700 border-purple-200",
    STOP_SKIPPED_MISSED: "bg-red-50 text-red-700 border-red-200",
}

const TYPE_LABEL: Record<StopAlertType, string> = {
    BUS_APPROACHING_STOP: "Approaching",
    BUS_ARRIVED_AT_STOP: "Arrived",
    BUS_DEPARTED_STOP: "Departed",
    STOP_SKIPPED_MISSED: "Skipped",
}

const TYPE_ICON: Record<StopAlertType, LucideIcon> = {
    BUS_APPROACHING_STOP: Navigation,
    BUS_ARRIVED_AT_STOP: MapPinCheck,
    BUS_DEPARTED_STOP: ArrowRightCircle,
    STOP_SKIPPED_MISSED: AlertTriangle,
}

const COLS = "220px 200px 90px 150px minmax(0,1fr)"
const DEFAULT_PAGE_SIZE = 25

export function StopsReportPanel() {
    const [vehicleNo, setVehicleNo] = useState("")
    const [groupId, setGroupId] = useState("")
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")])

    const [entries, setEntries] = useState<Alert[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)
    const [hasRun, setHasRun] = useState(false)

    const load = useCallback(async (p: number, size: number, from: Dayjs, to: Dayjs, veh: string, grp: string) => {
        setLoading(true)
        try {
            const data = await fetchStopsReport(
                p, size, from.format("YYYY-MM-DDTHH:mm:ss"), to.format("YYYY-MM-DDTHH:mm:ss"), veh || undefined, grp || undefined
            )
            setEntries(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
            setHasRun(true)
        } catch (e) {
            console.error("Failed to load stops report", e)
            toast.error("Failed to load stops report")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleRun = () => { setPage(0); load(0, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handleRefresh = () => load(page, pageSize, range[0], range[1], vehicleNo, groupId)
    const handlePrev = () => { const np = Math.max(0, page - 1); setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handleNext = () => { const np = page + 1 < totalPages ? page + 1 : page; setPage(np); load(np, pageSize, range[0], range[1], vehicleNo, groupId) }
    const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(0); load(0, size, range[0], range[1], vehicleNo, groupId) }

    const isEmpty = entries.length === 0

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Stops Report</h2>
                        <p className="text-xs text-slate-400">Arrivals, departures, and skipped stops</p>
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
                        <div className="p-3 bg-slate-50 rounded-full"><MapPin size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">Pick a date range and click Run Report</p>
                    </div>
                ) : loading && isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading report...</p>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full"><MapPin size={24} className="text-slate-400" /></div>
                        <p className="text-sm font-medium">No stop events found for this range</p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: COLS }}>
                            <div className="px-4 py-3 font-semibold">Time</div>
                            <div className="px-4 py-3 font-semibold">Vehicle</div>
                            <div className="px-4 py-3 font-semibold">Trip</div>
                            <div className="px-4 py-3 font-semibold">Type</div>
                            <div className="px-4 py-3 font-semibold">Message</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {entries.map((a, idx) => {
                                const type = a.type as StopAlertType
                                const Icon = TYPE_ICON[type]
                                return (
                                    <div
                                        key={a.id}
                                        className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                        style={{ gridTemplateColumns: COLS }}
                                    >
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">{new Date(a.createdAt).toLocaleString()}</div>
                                        <div className="px-4 py-3 truncate self-center">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">{a.vehicleNo}</span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-500 text-xs self-center">#{a.tripId}</div>
                                        <div className="px-4 py-3 self-center min-w-0">
                                            <span className={`inline-flex items-center gap-1 max-w-full text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${TYPE_STYLE[type] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                {Icon && <Icon size={11} className="shrink-0" />}
                                                <span className="truncate">{TYPE_LABEL[type] ?? a.type}</span>
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-600 text-sm break-words self-center">{a.message}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <ReportPagination
                page={page} pageSize={pageSize} totalPages={totalPages} totalElements={totalElements}
                loading={loading} idPrefix="stops-report"
                onPrev={handlePrev} onNext={handleNext} onPageSizeChange={handlePageSizeChange}
            />
        </div>
    )
}
