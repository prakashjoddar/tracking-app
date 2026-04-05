"use client"

import TripListPanel from "@/components/trip/TripListPanel"
import TripForm from "@/components/trip/TripForm"

export default function TripPanel() {
    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT — trip list */}
            <div className="w-[380px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <TripListPanel />
            </div>

            {/* RIGHT — trip form */}
            <div className="flex-1 h-full overflow-hidden">
                <TripForm />
            </div>

        </div>
    )
}