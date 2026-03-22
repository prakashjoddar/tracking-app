"use client"

import { GoogleMapView } from "@/components/map/GoogleMapView"
import TripPanel from "@/components/trip/TripPanel"

export default function TripsPage() {

    const showMap = false

    return (
        <div className="flex h-full">

            <div className={showMap ? "w-[400px] border-r p-4" : "w-full p-4"}>
                <TripPanel />
            </div>

            {showMap && (
                <div className="flex-1">
                    <GoogleMapView />
                </div>
            )}

        </div>
    )
}