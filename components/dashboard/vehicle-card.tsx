"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VehicleLocation } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Bell, Edit, Heart, Route, Navigation } from "lucide-react"
import { BiSignal1, BiSignal2, BiSignal3, BiSignal4, BiSignal5 } from "react-icons/bi"
import { IoRocketSharp } from "react-icons/io5"
import { LiaSatelliteDishSolid } from "react-icons/lia"
import { MdOutlineSync } from "react-icons/md"
import { IoMdBus } from "react-icons/io"
import { RiRoadMapLine } from "react-icons/ri"

interface VehicleCardProps {
    location: VehicleLocation
    isSelected: boolean
    isRouteActive: boolean
    isFollowing: boolean
    onClick: () => void
    onFavorite: () => void
    onRoute: () => void
    onFollow: () => void
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; color: string }> = {
    RUNNING: { bg: "bg-green-50 border-green-200", text: "text-green-700", dot: "bg-green-500", color: "#22c55e" },
    IDLE: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", color: "#3b82f6" },
    STOPPED: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", dot: "bg-orange-500", color: "#f97316" },
    PARKED: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", color: "#ef4444" },
    TRIP: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500", color: "#a855f7" },
    OFFLINE: { bg: "bg-gray-50 border-gray-200", text: "text-gray-500", dot: "bg-gray-400", color: "#9ca3af" },
}

const SPEED_COLOR = (speed: number) => {
    if (speed >= 75) return { text: "text-red-600", bar: "bg-red-600" }
    if (speed >= 60) return { text: "text-red-400", bar: "bg-red-400" }
    if (speed >= 50) return { text: "text-yellow-500", bar: "bg-yellow-500" }
    if (speed >= 20) return { text: "text-green-500", bar: "bg-green-500" }
    return { text: "text-gray-400", bar: "bg-gray-300" }
}

const SignalIcon = ({ value }: { value?: number }) => {
    const cls = "size-3.5"
    if (!value) return <BiSignal1 className={cn(cls, "text-gray-400")} />
    if (value >= 80) return <BiSignal5 className={cn(cls, "text-green-500")} />
    if (value >= 60) return <BiSignal4 className={cn(cls, "text-yellow-500")} />
    if (value >= 40) return <BiSignal3 className={cn(cls, "text-orange-500")} />
    if (value >= 20) return <BiSignal2 className={cn(cls, "text-red-500")} />
    return <BiSignal1 className={cn(cls, "text-gray-400")} />
}

export function VehicleCard({
    location, isSelected, isRouteActive, isFollowing,
    onClick, onFavorite, onRoute, onFollow
}: VehicleCardProps) {

    const status = STATUS_CONFIG[location.status] ?? STATUS_CONFIG.OFFLINE
    const speed = SPEED_COLOR(location.speed ?? 0)

    return (
        <div
            onClick={() => { onClick(); onFollow() }}
            style={{ borderLeftColor: status.color }}
            className={cn(
                "rounded-xl border border-l-4 bg-white shadow-sm cursor-pointer transition-all duration-150",
                "hover:shadow-md hover:border-gray-300",
                isSelected && "shadow-md ring-1 ring-blue-200",
                isRouteActive && "bg-green-50/50",
            )}
        >
            <div className="p-3 space-y-2.5">

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex items-start gap-2.5">

                    {/* Icon */}
                    <div className={cn(
                        "size-9 shrink-0 rounded-lg flex items-center justify-center border",
                        status.bg
                    )}>
                        <IoMdBus className={cn("size-5", status.text)} />
                    </div>

                    {/* Label + time */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{location.label}</span>
                            {location.status === "RUNNING" && (
                                <span className="relative flex size-1.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full size-1.5 bg-green-500" />
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {location.date} · {location.time}
                        </p>
                    </div>

                    {/* Speed */}
                    <div className="shrink-0 text-right">
                        <p className={cn("text-sm font-bold tabular-nums", speed.text)}>
                            {location.speed ?? 0}
                            <span className="text-[10px] font-normal ml-0.5">km/h</span>
                        </p>
                        <div className="mt-1 w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all", speed.bar)}
                                style={{ width: `${Math.min((location.speed / 120) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Metrics row ─────────────────────────────── */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">

                    {/* Ignition */}
                    <div className="flex items-center gap-1">
                        <IoRocketSharp className={cn("size-3", location.ignition ? "text-green-500" : "text-gray-300")} />
                        <span className={location.ignition ? "text-green-600 font-medium" : ""}>
                            {location.ignition ? "ON" : "OFF"}
                        </span>
                    </div>

                    <span className="text-gray-200">|</span>

                    {/* Signal */}
                    <div className="flex items-center gap-1">
                        <SignalIcon value={location.signalStrength} />
                        <span>{location.signalStrength ?? "—"}%</span>
                    </div>

                    <span className="text-gray-200">|</span>

                    {/* Satellites */}
                    <div className="flex items-center gap-1">
                        <LiaSatelliteDishSolid className="size-3" />
                        <span>{location.noOfSatellites ?? "—"}</span>
                    </div>

                    {/* Status badge — pushed right */}
                    <div className="ml-auto">
                        <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                            status.bg, status.text
                        )}>
                            {location.status}
                        </span>
                    </div>
                </div>

                {/* ── Expanded actions (selected only) ────────── */}
                {isSelected && (
                    <div className="pt-1 border-t flex items-center justify-between gap-2">

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { label: "Edit", icon: <Edit size={12} className="text-orange-500" />, hover: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600" },
                                { label: "Trip", icon: <RiRoadMapLine size={12} className="text-blue-500" />, hover: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600" },
                                { label: "Replace", icon: <MdOutlineSync size={12} className="text-green-500" />, hover: "hover:bg-green-50 hover:border-green-300 hover:text-green-600" },
                                { label: "Alerts", icon: <Bell size={12} className="text-red-500" />, hover: "hover:bg-red-50 hover:border-red-300 hover:text-red-600" },
                            ].map(({ label, icon, hover }) => (
                                <button
                                    key={label}
                                    onClick={e => e.stopPropagation()}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border bg-white text-gray-600 transition-colors",
                                        hover
                                    )}
                                >
                                    {label}
                                    {icon}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                                variant="ghost" size="icon"
                                className={cn("size-7", isRouteActive && "text-green-500 bg-green-50")}
                                onClick={e => { e.stopPropagation(); onRoute() }}
                            >
                                <Route size={14} />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="size-7 hover:bg-red-50"
                                onClick={e => { e.stopPropagation(); onFavorite() }}
                            >
                                <Heart size={14} className="text-red-400" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}