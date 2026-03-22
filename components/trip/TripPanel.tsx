"use client"

import TripListPanel from "@/components/trip/TripListPanel"
import JourneyForm from "@/components/trip/JourneyForm"

export default function TripPanel() {
    return (
        <div className="flex h-full">

            {/* LEFT PANEL */}
            <div className="w-[420px] border-r p-4 overflow-y-auto">
                <TripListPanel />
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 p-6">
                <JourneyForm />
            </div>

        </div>
    )
}