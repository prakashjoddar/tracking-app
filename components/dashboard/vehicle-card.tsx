"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VehicleLocation } from "@/lib/types"
import { cn } from "@/lib/utils"
import { statusColor } from "@/mock-data/locations"
import { Bell, Edit, Heart, Navigation2, Route } from "lucide-react"
import { BiSignal1, BiSignal2, BiSignal3, BiSignal4, BiSignal5 } from "react-icons/bi"
import { IoRocketSharp } from "react-icons/io5"
import { LiaSatelliteDishSolid } from "react-icons/lia"
import { MdOutlineSync } from "react-icons/md"
import { PiMapPinFill } from "react-icons/pi"
import { RiMotorbikeFill, RiRoadMapLine } from "react-icons/ri"
import { IoMdBus } from "react-icons/io";
import { FaTruckMoving } from "react-icons/fa"

interface VehicleCardProps {
    location: VehicleLocation
    isSelected: boolean
    isRouteActive: boolean
    onClick: () => void
    onFavorite: () => void
    onRoute: () => void,
    onFollow: () => void
    isFollowing: boolean
}

export function VehicleCard({
    location,
    isSelected,
    isRouteActive,
    isFollowing,
    onClick,
    onFavorite,
    onRoute,
    onFollow
}: VehicleCardProps) {

    const getSignalIcon = (signal?: number) => {
        if (!signal) return null
        if (signal >= 80) return <BiSignal5 className="text-green-500 size-4" />
        if (signal >= 60) return <BiSignal4 className="text-yellow-500 size-4" />
        if (signal >= 40) return <BiSignal3 className="text-orange-500 size-4" />
        if (signal >= 20) return <BiSignal2 className="text-red-500 size-4" />
        return <BiSignal1 className="text-gray-400 size-4" />
    }

    const getSpeedStatusBarColor = () => {
        if (!location.speed) return "gray-400"
        if (location.speed >= 75) return "red-900"
        if (location.speed >= 60) return "red-500"
        if (location.speed >= 50) return "yellow-500"
        if (location.speed >= 20) return "green-500"
        return "gray-400"
    }

    const getStatusColor = () => {
        switch (location.status) {
            case "RUNNING":
                return "bg-green-500"
            case "IDLE":
                return "bg-blue-500"
            case "STOPPED":
                return "bg-orange-500"
            case "PARKED":
                return "bg-red-500"
            case "OFFLINE":
                return "bg-gray-400"
            default:
                return "bg-gray-300"
        }
    }

    return (
        <div
            onClick={() => {
                onClick()
                onFollow()
            }}
            className={cn(
                "group flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-xl hover:border-primary/40 cursor-pointer",
                isSelected && "shadow-2xl border-primary",
                isRouteActive && "border-green-500 bg-green-50"
            )}
        >

            {/* HEADER */}
            <div className="flex items-start justify-between">

                <div className="flex gap-3">

                    {/* Vehicle Icon */}
                    <div className="size-10 flex items-center justify-center rounded-lg bg-muted border">
                        <IoMdBus className={cn("size-5.5", statusColor[location.status])} />
                        {/* <RiMotorbikeFill className={cn("size-5.5", statusColor[location.status])} />
                        <FaTruckMoving className={cn("size-5.5", statusColor[location.status])} /> */}
                    </div>

                    <div className="flex flex-col">
                        <h3 className="font-semibold text-sm">
                            {location.label}
                        </h3>

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {location.date} {location.time}
                            {location.status === "RUNNING" && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Speed */}
                <div className="flex flex-col items-end gap-1 shrink-0">

                    {/* Speed */}
                    <div className={cn("font-medium text-sm", "text-" + getSpeedStatusBarColor())}>
                        {location.speed} km/h
                    </div>

                    {/* Status bar */}
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full",
                                "bg-" + getSpeedStatusBarColor()
                            )}
                            // calculate width based on speed and max speed (e.g., 120 km/h)
                            style={{ width: `${(location.speed / 120) * 100}%` }}
                        />
                    </div>

                </div>
            </div>


            {/* METRICS */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">

                <div className="flex items-center gap-1">
                    <IoRocketSharp
                        className={cn(
                            "size-4",
                            location.ignition ? "text-green-500" : "text-red-500"
                        )}
                    />
                    {location.ignition ? "Ignition ON" : "Ignition OFF"}
                </div>

                <div className="flex items-center gap-1">
                    {getSignalIcon(location.signalStrength)}
                    {location.signalStrength} %
                </div>

                <div className="flex items-center gap-1">
                    <LiaSatelliteDishSolid className="size-4" />
                    {location.noOfSatellites} Satellites
                </div>

                <Badge className={cn("text-[10px] h-5 ml-auto shrink-0", getStatusColor())}>
                    {location.status}
                </Badge>

            </div>


            {/* ACTIONS */}
            {isSelected && <div className="flex items-center justify-between">

                {/* <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs border">Edit<Edit className="text-orange-500" /></Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs border">Trip<RiRoadMapLine className="text-blue-500" /></Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs border">Replace<MdOutlineSync className="text-green-500" /></Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs border">Alerts <Bell className="text-red-500" /></Button>
                </div> */}

                <div className="flex items-center gap-2">

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 h-8 text-xs border transition hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        Edit
                        <Edit className="text-orange-500 size-3.5" />
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 h-8 text-xs border transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        Trip
                        <RiRoadMapLine className="text-blue-500 size-3.5" />
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 h-8 text-xs border transition hover:bg-green-50 hover:border-green-300 hover:text-green-600 hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        Replace
                        <MdOutlineSync className="text-green-500 size-3.5" />
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 h-8 text-xs border transition hover:bg-red-50 hover:border-red-300 hover:text-red-600 hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    >
                        Alerts
                        <Bell className="text-red-500 size-3.5" />
                    </Button>

                </div>

                <div className="flex items-center gap-1">

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "size-8 hover:bg-gray-200 transition",
                            isRouteActive && "text-green-500"
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            onRoute()
                        }}
                    >
                        <Route className="size-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-red-200 transition"
                        onClick={(e) => {
                            e.stopPropagation()
                            onFavorite()
                        }}
                    >
                        <Heart className="size-4 text-red-500" />
                    </Button>

                </div>
            </div>}


            {/* STATUS BAR */}
            {/* <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full",
                        getStatusColor()
                    )}
                    style={{ width: "70%" }}
                />
            </div> */}

        </div >
    )
}