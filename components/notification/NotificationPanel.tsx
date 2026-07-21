"use client"

import { useEffect, useState } from "react"
import { useNotificationStore } from "@/store/notification-store"
import { NotificationEvent } from "@/lib/types"
import {
    Bell, X, Trash2, AlertTriangle, Zap, PowerOff, Activity, Pause, BatteryWarning,
    PlayCircle, CheckCircle2, Navigation, MapPin, ArrowRightCircle, type LucideIcon,
} from "lucide-react"

const typeStyle: Record<string, string> = {
    IGNITION_ON: "bg-green-50 text-green-700 border-green-200",
    IGNITION_OFF: "bg-slate-100 text-slate-600 border-slate-200",
    OVER_SPEED: "bg-red-50 text-red-700 border-red-200",
    RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
    IDLE: "bg-yellow-50 text-yellow-700 border-yellow-200",
    HALT: "bg-orange-50 text-orange-700 border-orange-200",
    STOPPED: "bg-orange-50 text-orange-700 border-orange-200",
    PARKED: "bg-slate-100 text-slate-600 border-slate-200",
    BATTERY_LOW: "bg-red-50 text-red-700 border-red-200",
    BUS_APPROACHING_STOP: "bg-yellow-50 text-yellow-700 border-yellow-200",
    BUS_ARRIVED_AT_STOP: "bg-blue-50 text-blue-700 border-blue-200",
    BUS_DEPARTED_STOP: "bg-purple-50 text-purple-700 border-purple-200",
    STOP_SKIPPED_MISSED: "bg-red-50 text-red-700 border-red-200",
    TRIP_STARTED: "bg-green-50 text-green-700 border-green-200",
    TRIP_FINISHED: "bg-slate-100 text-slate-600 border-slate-200",
}

const typeLabel: Record<string, string> = {
    IGNITION_ON: "Ignition On",
    IGNITION_OFF: "Ignition Off",
    OVER_SPEED: "Over Speed",
    RUNNING: "Running",
    IDLE: "Idle",
    HALT: "Halt",
    STOPPED: "Stopped",
    PARKED: "Parked",
    BATTERY_LOW: "Battery Low",
    BUS_APPROACHING_STOP: "Approaching Stop",
    BUS_ARRIVED_AT_STOP: "Arrived at Stop",
    BUS_DEPARTED_STOP: "Departed Stop",
    STOP_SKIPPED_MISSED: "Stop Skipped",
    TRIP_STARTED: "Trip Started",
    TRIP_FINISHED: "Trip Finished",
}

const typeIcon: Record<string, LucideIcon> = {
    IGNITION_ON: Zap,
    IGNITION_OFF: PowerOff,
    OVER_SPEED: AlertTriangle,
    RUNNING: Activity,
    IDLE: Pause,
    HALT: Pause,
    STOPPED: Pause,
    PARKED: MapPin,
    BATTERY_LOW: BatteryWarning,
    BUS_APPROACHING_STOP: Navigation,
    BUS_ARRIVED_AT_STOP: MapPin,
    BUS_DEPARTED_STOP: ArrowRightCircle,
    STOP_SKIPPED_MISSED: AlertTriangle,
    TRIP_STARTED: PlayCircle,
    TRIP_FINISHED: CheckCircle2,
}

const accentByPriority: Record<string, string> = {
    CRITICAL: "#dc2626",
    HIGH: "#f87171",
    MEDIUM: "#fbbf24",
    LOW: "#94a3b8",
}

function accentFor(n: NotificationEvent): string {
    if (n.priority) return accentByPriority[n.priority] ?? accentByPriority.LOW
    if (n.type === "STOP_SKIPPED_MISSED") return accentByPriority.HIGH
    return accentByPriority.LOW
}

function timeAgo(iso: string, now: number): string {
    const diffSec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
    if (diffSec < 5) return "Just now"
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return new Date(iso).toLocaleDateString()
}

function NotificationCard({ n, now }: { n: NotificationEvent; now: number }) {
    const Icon = typeIcon[n.type] ?? Bell
    const style = typeStyle[n.type] ?? "bg-slate-100 text-slate-600 border-slate-200"
    const label = typeLabel[n.type] ?? n.type
    const accent = accentFor(n)

    return (
        <div
            className="group relative rounded-2xl border border-sidebar-border bg-background shadow-sm px-3.5 py-3 overflow-hidden transition-shadow hover:shadow-md"
            style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}
        >
            <div className="flex items-start gap-3">
                <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border ${style}`}>
                    <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>
                            {label}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                            {timeAgo(n.dateTime, now)}
                        </span>
                    </div>
                    <p className="text-sm leading-snug mt-1.5 break-words">{n.message}</p>
                    <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-md bg-sidebar-accent text-muted-foreground font-mono text-[11px] font-medium">
                        {n.vehicleNo}
                    </span>
                </div>
            </div>
        </div>
    )
}

export function NotificationPanel() {
    const isOpen = useNotificationStore((s) => s.isOpen)
    const notifications = useNotificationStore((s) => s.notifications)
    const close = useNotificationStore((s) => s.close)
    const clear = useNotificationStore((s) => s.clear)

    // Drives the relative "Xs/m/h ago" labels without re-fetching anything.
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!isOpen) return
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [isOpen])

    return (
        <div
            className={`fixed inset-y-0 right-0 z-45 w-[380px] bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-lg transition-transform duration-200 ease-linear ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}
        >
            <div className="flex flex-col h-full">
                <div className="shrink-0 px-5 py-4 border-b border-sidebar-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold leading-tight">Notifications</h2>
                            <p className="text-xs text-muted-foreground">{notifications.length} received</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                            <button
                                onClick={clear}
                                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
                                title="Clear all"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <button
                            onClick={close}
                            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                            <div className="p-3 bg-sidebar-accent rounded-full">
                                <Bell size={22} />
                            </div>
                            <p className="text-sm font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => <NotificationCard key={n.id} n={n} now={now} />)
                    )}
                </div>
            </div>
        </div>
    )
}
