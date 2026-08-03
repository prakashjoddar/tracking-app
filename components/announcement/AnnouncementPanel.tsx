"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAnnouncements, sendAnnouncement } from "@/lib/api"
import { AnnouncementResponse, RecipientType } from "@/lib/types"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
    Megaphone, Send, Bus, Users, GraduationCap, User, RefreshCw,
    ChevronLeft, ChevronRight, Loader2, Car, ShieldCheck, type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

const DEFAULT_PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const recipientOptions: { value: RecipientType; label: string; icon: LucideIcon }[] = [
    { value: "ALL", label: "All", icon: Users },
    { value: "PARENT", label: "Parent", icon: User },
    { value: "STUDENT", label: "Student", icon: GraduationCap },
    { value: "DRIVER", label: "Driver", icon: Car },
    { value: "SUPERVISOR", label: "Supervisor", icon: ShieldCheck },
]

const recipientBadgeStyle: Record<RecipientType, string> = {
    ALL: "bg-slate-100 text-slate-600 border-slate-200",
    PARENT: "bg-purple-50 text-purple-700 border-purple-200",
    STUDENT: "bg-green-50 text-green-700 border-green-200",
    DRIVER: "bg-orange-50 text-orange-700 border-orange-200",
    SUPERVISOR: "bg-blue-50 text-blue-700 border-blue-200",
}

const HISTORY_COLS = "170px 200px 110px minmax(0,1fr)"

export function AnnouncementPanel() {
    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const [vehicleNo, setVehicleNo] = useState("") // "" = all vehicles
    const [recipientType, setRecipientType] = useState<RecipientType>("ALL")
    const [text, setText] = useState("")
    const [sending, setSending] = useState(false)

    const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([])
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(false)

    const loadAnnouncements = useCallback(async (p: number) => {
        setLoading(true)
        try {
            const data = await fetchAnnouncements(p, pageSize)
            setAnnouncements(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
        } catch (e) {
            console.error("Failed to fetch announcements", e)
        } finally {
            setLoading(false)
        }
    }, [pageSize])

    useEffect(() => {
        loadAnnouncements(page)
    }, [page, loadAnnouncements])

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setPage(0)
    }

    const vehicleOptions = [
        { label: "All Vehicles", value: "", icon: <Users size={14} className="text-slate-400" /> },
        ...vehicles.map((v) => ({
            label: v.name || "Unnamed Vehicle",
            subLabel: v.number,
            value: v.number,
            icon: <Bus size={14} className="text-blue-500" />,
        })),
    ]

    const handleSend = async () => {
        if (!text.trim()) {
            toast.error("Announcement text is required")
            return
        }
        setSending(true)
        try {
            await sendAnnouncement({ vehicleNo: vehicleNo || null, recipientType, text: text.trim() })
            toast.success("Announcement sent")
            setText("")
            setPage(0)
            loadAnnouncements(0)
        } catch (e) {
            console.error("Failed to send announcement", e)
            toast.error("Failed to send announcement")
        } finally {
            setSending(false)
        }
    }

    const isEmpty = announcements.length === 0
    const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
    const rangeEnd = Math.min(totalElements, (page + 1) * pageSize)

    return (
        <div className="flex h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            {/* Compose */}
            <div className="w-[380px] shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
                <div className="px-6 pt-6 pb-5 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">New Announcement</h2>
                            <p className="text-xs text-slate-400">Broadcast to parents or students</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-6 py-5 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Vehicle</label>
                        <SearchableSelect
                            options={vehicleOptions}
                            value={vehicleNo}
                            onChange={setVehicleNo}
                            placeholder="All vehicles"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Recipients</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {recipientOptions.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRecipientType(value)}
                                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${recipientType === value
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Announcement</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={7}
                            placeholder="Type your announcement..."
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
                        />
                        <p className="text-[11px] text-slate-400 text-right">{text.length} characters</p>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <button
                        onClick={handleSend}
                        disabled={sending || !text.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {sending ? "Sending..." : "Send Announcement"}
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Sent Announcements</h2>
                        <p className="text-xs text-slate-400">{totalElements.toLocaleString()} total</p>
                    </div>
                    <button
                        onClick={() => loadAnnouncements(page)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
                    {loading && isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                            <RefreshCw size={24} className="animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Loading announcements...</p>
                        </div>
                    ) : isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="p-3 bg-slate-50 rounded-full">
                                <Megaphone size={24} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-medium">No announcements sent yet</p>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div
                                className="grid border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400"
                                style={{ gridTemplateColumns: HISTORY_COLS }}
                            >
                                <div className="px-4 py-3 font-semibold">Time</div>
                                <div className="px-4 py-3 font-semibold">Vehicle</div>
                                <div className="px-4 py-3 font-semibold">Recipients</div>
                                <div className="px-4 py-3 font-semibold">Announcement</div>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {announcements.map((m, idx) => (
                                    <div
                                        key={m.id}
                                        className={`grid border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                                        style={{ gridTemplateColumns: HISTORY_COLS }}
                                    >
                                        <div className="px-4 py-3 text-slate-500 text-xs truncate self-center">
                                            {new Date(m.createdAt).toLocaleString()}
                                        </div>
                                        <div className="px-4 py-3 truncate self-center">
                                            {m.vehicleNo ? (
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium truncate max-w-full">
                                                    {m.vehicleNo}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <Users size={12} /> All vehicles
                                                </span>
                                            )}
                                        </div>
                                        <div className="px-4 py-3 self-center">
                                            <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full border ${recipientBadgeStyle[m.recipientType]}`}>
                                                {m.recipientType}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 text-slate-600 text-sm break-words self-center">{m.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-500">
                            {totalElements === 0 ? (
                                "No results"
                            ) : (
                                <>
                                    Showing <span className="font-medium text-slate-700">{rangeStart}–{rangeEnd}</span> of{" "}
                                    <span className="font-medium text-slate-700">{totalElements.toLocaleString()}</span>
                                </>
                            )}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <label htmlFor="announcement-page-size" className="text-xs text-slate-400">Rows</label>
                            <select
                                id="announcement-page-size"
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="text-xs border border-slate-200 rounded-lg pl-2 pr-6 py-1 text-slate-600 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            >
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                            <ChevronLeft size={15} />
                            Prev
                        </button>
                        <span className="text-xs text-slate-400 px-1">
                            {totalPages === 0 ? 0 : page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                            disabled={page + 1 >= totalPages || loading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                            Next
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
