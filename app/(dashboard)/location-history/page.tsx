"use client"

import PlaybackControls from "@/components/history/playback-controls"
import { useVehicleHistory } from "@/hooks/useVehicleHistory"
import { GoogleMapView } from "@/components/map/GoogleMapView"

export default function LocationHistoryPage() {

    useVehicleHistory("350317177739350", "2026-03-15")

    return (
        <div className="flex h-full">

            <div className="w-[400px] border-r p-4">
                <PlaybackControls />
            </div>

            <div className="flex-1">
                <GoogleMapView />
            </div>

        </div>
    )
}