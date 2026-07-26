"use client"

import { useEffect } from "react"
import PlaybackControls from "@/components/history/playback-controls"
import { MapEngine } from "@/components/map/MapEngine"
import { useVehicleHistory } from "@/hooks/useVehicleHistory"
import { useCurrentUserStore } from "@/store/current-user-store"

export default function LocationHistoryPage() {

    useVehicleHistory("350317177739350", "2026-03-15")

    const mapProvider = useCurrentUserStore(s => s.user?.mapProvider) === "MAPLIBRE" ? "maplibre" : "google"
    const fetchCurrentUserOnce = useCurrentUserStore(s => s.fetchCurrentUserOnce)
    useEffect(() => { fetchCurrentUserOnce() }, [fetchCurrentUserOnce])

    return (
        <div className="flex h-full overflow-hidden">

            <div className="w-[360px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <PlaybackControls />
            </div>

            <div className="flex-1 h-full">
                <MapEngine provider={mapProvider} />
            </div>

        </div>
    )
}
