"use client"

import { StopDistanceMapGoogle } from "./StopDistanceMapGoogle"
import { StopDistanceMapLibre } from "./StopDistanceMapLibre"

type StopDistanceRow = {
    sequence: number
    name: string
    distanceKm: number
    latitude: number
    longitude: number
}

type Props = {
    rows: StopDistanceRow[]
    waypoint?: string | null
    provider?: "google" | "maplibre"
}

/** Same provider switch as MapEngine, so the stop-distance report map respects the current user's mapProvider setting. */
export function StopDistanceMapEngine({ provider = "google", ...props }: Props) {
    if (provider === "maplibre") {
        return <StopDistanceMapLibre {...props} />
    }
    return <StopDistanceMapGoogle {...props} />
}
