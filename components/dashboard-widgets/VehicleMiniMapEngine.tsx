"use client"

import { VehicleLocation } from "@/lib/types"
import { VehicleMiniMapGoogle } from "./VehicleMiniMapGoogle"
import { VehicleMiniMapLibre } from "./VehicleMiniMapLibre"

type Props = {
    vehicle: VehicleLocation | null
    provider?: "google" | "maplibre"
}

/** Same provider switch as MapEngine, so the dashboard's live-vehicle mini-map respects the current user's mapProvider setting. */
export function VehicleMiniMapEngine({ vehicle, provider = "google" }: Props) {
    if (provider === "maplibre") {
        return <VehicleMiniMapLibre vehicle={vehicle} />
    }
    return <VehicleMiniMapGoogle vehicle={vehicle} />
}
