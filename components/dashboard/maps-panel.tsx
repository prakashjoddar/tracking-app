"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useVehicleLocations } from "@/hooks/useVehicleLocations"
import { VehicleLocation } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useVehicleStore } from "@/store/location-store"
import { useMapsStore } from "@/store/maps-store"
import { useHistoryStore } from "@/store/history-store"
import { fetchVehicleLocationHistory } from "@/lib/api"
import {
  ArrowDownAZ, ArrowUpAZ, ArrowUpDown,
  CalendarArrowDown, CalendarArrowUp,
  Check, ChevronLeft, ChevronRight,
  Search, X, Locate
} from "lucide-react"
import * as React from "react"
import { useState } from "react"
import Draggable from "react-draggable"
import { VehicleCard } from "./vehicle-card"
import { toast } from "sonner"

type PanelMode = "all" | "favorites" | "recents"
type StatusFilter = "ALL" | "RUNNING" | "IDLE" | "STOPPED" | "PARKED" | "TRIP" | "OFFLINE"

const STATUS_TABS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "ALL", label: "All", color: "text-gray-600" },
  { value: "RUNNING", label: "Running", color: "text-green-600" },
  { value: "IDLE", label: "Idle", color: "text-blue-600" },
  { value: "STOPPED", label: "Stopped", color: "text-orange-600" },
  { value: "PARKED", label: "Parked", color: "text-red-600" },
  { value: "TRIP", label: "Trip", color: "text-purple-600" },
  { value: "OFFLINE", label: "Offline", color: "text-gray-400" },
]

function getLocationFromIP(): Promise<{ lat: number; lng: number } | null> {
  return fetch("https://ipapi.co/json/")
    .then(r => r.json())
    .then(d => d.latitude ? { lat: d.latitude, lng: d.longitude } : null)
    .catch(() => null)
}

interface MapsPanelProps {
  mode?: PanelMode
}

export function MapsPanel({ mode = "all" }: MapsPanelProps) {

  const nodeRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [onLeft, setOnLeft] = useState<boolean>(true)

  useVehicleLocations()
  const vehicles = useVehicleStore(s => s.vehicles)
  const setLocationHistory = useVehicleStore(s => s.setLocationHistory)

  const {
    selectedLocationId, searchQuery, sortBy,
    selectLocation, toggleFavorite,
    setSearchQuery, setSortBy,
    userLocation, setUserLocation,
    routeDestinationId, setRouteDestination, clearRoute,
    isPanelVisible, setPanelVisible,
    followVehicleId, setFollowVehicle, setAutoFocus,
  } = useMapsStore()

  // ── location helpers ──────────────────────────────────────────
  const requestLocation = React.useCallback(async () => {
    return new Promise<{ lat: number; lng: number } | null>(resolve => {
      if (!("geolocation" in navigator)) {
        getLocationFromIP().then(loc => {
          if (loc) setUserLocation(loc)
          resolve(loc)
        })
        return
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          resolve(loc)
        },
        async () => {
          const loc = await getLocationFromIP()
          if (loc) setUserLocation(loc)
          resolve(loc)
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
    })
  }, [setUserLocation])

  // ── handlers ─────────────────────────────────────────────────
  const handleVehicleClick = (v: VehicleLocation): void => {
    if (selectedLocationId === v.vehicleNo) {
      selectLocation(null)
    } else {
      selectLocation(v.vehicleNo)
      setAutoFocus(true)
      setFollowVehicle(v.vehicleNo)
    }
  }

  const handleHistory = async (v: VehicleLocation): Promise<void> => {
    try {
      const now = new Date()
      const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString().split("T")[0]
      const data = await fetchVehicleLocationHistory(v.vehicleNo, date)
      if (data && data.length > 0) {
        setLocationHistory(v.vehicleNo, date, data)
        // Also sync with the global history playback store
        useHistoryStore.getState().setPoints(data)
        toast.success(`History for ${v.vehicleNo} loaded successfully!`)
      } else {
        toast.error(`No history found for ${v.vehicleNo} on ${date}`)
      }
    } catch (e: any) {
      console.error("History fetch error", e)
      toast.error(e.response?.data?.message || "Failed to fetch location history")
    }
    if (!userLocation) await requestLocation()
    setRouteDestination(v.vehicleNo)
  }

  // ── filtering ─────────────────────────────────────────────────
  const filtered = vehicles
    .filter(v => statusFilter === "ALL" || v.status === statusFilter)
    .filter(v => !searchQuery || v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) || v.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date-newest" || sortBy === "date-oldest") {
        const dateTimeA = `${a.date}T${a.time}`
        const dateTimeB = `${b.date}T${b.time}`
        return sortBy === "date-newest" 
          ? dateTimeB.localeCompare(dateTimeA) 
          : dateTimeA.localeCompare(dateTimeB)
      }
      
      if (sortBy === "alpha-az" || sortBy === "alpha-za") {
        const labelA = a.label.toLowerCase()
        const labelB = b.label.toLowerCase()
        return sortBy === "alpha-az"
          ? labelA.localeCompare(labelB)
          : labelB.localeCompare(labelA)
      }
      
      return 0
    })

  const getCount = (s: StatusFilter) =>
    s === "ALL" ? vehicles.length : vehicles.filter(v => v.status === s).length

  // ── closed state ──────────────────────────────────────────────
  if (!isPanelVisible) {
    return (
      <button
        className="absolute left-4 top-4 z-20 size-9 bg-white shadow-lg rounded-xl border flex items-center justify-center hover:bg-gray-50 transition-colors"
        onClick={() => setPanelVisible(true)}
      >
        <ChevronRight size={18} />
      </button>
    )
  }

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      <div
        ref={nodeRef}
        className={cn(
          "absolute top-4 bottom-4 z-20 flex flex-col",
          "bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80",
          "overflow-hidden w-[340px] sm:w-[380px]",
          onLeft ? "left-4" : "right-8"
        )}
      >
        {/* ── Drag handle / header ──────────────────── */}
        <div className="drag-handle cursor-move select-none shrink-0 px-3 py-2.5 border-b bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelVisible(false)}
              className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
            <div>
              <p className="font-semibold text-sm leading-none">Fleet Monitor</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {vehicles.length} vehicles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* locate me */}
            <button
              onClick={requestLocation}
              title="Get my location"
              className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Locate size={14} className={cn(userLocation ? "text-blue-500" : "text-gray-400")} />
            </button>
            {/* flip side */}
            <button
              onClick={() => setOnLeft(v => !v)}
              className="size-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              {onLeft
                ? <ChevronRight size={14} className="text-gray-500" />
                : <ChevronLeft size={14} className="text-gray-500" />
              }
            </button>
          </div>
        </div>

        {/* ── Status tabs ───────────────────────────── */}
        <div className="shrink-0 px-3 pt-2.5 pb-2 border-b">
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map(tab => {
              const count = getCount(tab.value)
              const active = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors border",
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "text-[10px] px-1 py-0.5 rounded-full font-semibold min-w-[16px] text-center",
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Search + Sort ─────────────────────────── */}
        <div className="shrink-0 px-3 py-2 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className={cn("pl-8 h-8 text-xs rounded-lg", searchQuery && "pr-7")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X size={12} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8 shrink-0">
                <ArrowUpDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {[
                { key: "date-newest", label: "Newest first", icon: <CalendarArrowDown size={13} /> },
                { key: "date-oldest", label: "Oldest first", icon: <CalendarArrowUp size={13} /> },
                { key: "alpha-az", label: "A → Z", icon: <ArrowDownAZ size={13} /> },
                { key: "alpha-za", label: "Z → A", icon: <ArrowUpAZ size={13} /> },
              ].map(item => (
                <DropdownMenuItem
                  key={item.key}
                  onClick={() => setSortBy(item.key as any)}
                  className="gap-2 text-xs"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {sortBy === item.key && <Check size={12} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Vehicle list ──────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <p className="text-xs">No vehicles found</p>
            </div>
          ) : filtered.map(v => (
            <VehicleCard
              key={v.vehicleNo}
              location={v}
              isSelected={selectedLocationId === v.vehicleNo}
              isRouteActive={routeDestinationId === v.vehicleNo}
              isFollowing={followVehicleId === v.vehicleNo}
              onClick={() => handleVehicleClick(v)}
              onFavorite={() => toggleFavorite(v.vehicleNo)}
              onRoute={() => handleHistory(v)}
              onFollow={() => setFollowVehicle(
                followVehicleId === v.vehicleNo ? null : v.vehicleNo
              )}
            />
          ))}
        </div>

        {/* ── Footer summary ────────────────────────── */}
        <div className="shrink-0 px-3 py-2 border-t bg-gray-50/60 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            {filtered.length} of {vehicles.length} shown
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-500 inline-block" />
              {getCount("RUNNING")} running
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-gray-400 inline-block" />
              {getCount("OFFLINE")} offline
            </span>
          </div>
        </div>
      </div>
    </Draggable>
  )
}