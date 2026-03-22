"use client"

import { GoogleMapView } from "@/components/map/GoogleMapView"
import StopForm from "@/components/trip/StopForm"
import StopListPanel from "@/components/trip/StopListPanel"
import { useTripStore } from "@/store/trip-store"
import { useEffect } from "react"

export default function StopsPage() {

    const { showMapOrStopForm, setShowMapOrStopForm } = useTripStore()

    useEffect(() => {
        return () => {
            useTripStore.getState().setShowMapOrStopForm(false)
        }
    }, [])

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT PANEL */}
            <div className="w-[420px] border-r flex flex-col h-full overflow-hidden">
                <StopListPanel />
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 relative h-full">

                {/* Map — always mounted, hidden when form is shown */}
                <div className={`absolute inset-0 ${showMapOrStopForm ? "visible" : "invisible"}`}>
                    <GoogleMapView />
                </div>

                {/* Form — always mounted, hidden when map is shown */}
                <div className={`absolute inset-0 p-6 overflow-y-auto bg-white ${showMapOrStopForm ? "invisible" : "visible"}`}>
                    <StopForm setShowMap={setShowMapOrStopForm} />
                </div>

            </div>

        </div>
    )
}