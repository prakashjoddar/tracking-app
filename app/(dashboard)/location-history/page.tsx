"use client"

import HistoryPanel from "@/components/history/history-panel"
import { MapEngine } from "@/components/map/MapEngine"

export default function LocationHistoryPage() {
    return (
        <div className="flex h-full w-full">

            {/* Left Panel */}
            <div className="w-[380px] border-r bg-background">
                <HistoryPanel />
            </div>

            {/* Map */}
            <div className="flex-1">
                <MapEngine />
            </div>

        </div>
    )
}