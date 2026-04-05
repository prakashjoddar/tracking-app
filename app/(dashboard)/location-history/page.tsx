"use client"

import PlaybackControls from "@/components/history/playback-controls"
import { GoogleMapView } from "@/components/map/GoogleMapView"
import { useVehicleHistory } from "@/hooks/useVehicleHistory"

export default function LocationHistoryPage() {

    useVehicleHistory("350317177739350", "2026-03-15")

    return (
        <div className="flex h-full overflow-hidden">

            <div className="w-[360px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <PlaybackControls />
            </div>

            <div className="flex-1 h-full">
                <GoogleMapView />
            </div>

        </div>
    )
}