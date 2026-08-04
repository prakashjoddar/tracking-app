"use client"

import { RouteDeviationMapGoogle } from "./RouteDeviationMapGoogle"
import { RouteDeviationMapLibre } from "./RouteDeviationMapLibre"

type Props = {
    plannedPath: [number, number][]
    actualPath: [number, number][]
    deviatedIndices: Set<number>
    provider?: "google" | "maplibre"
}

/** Same provider switch as MapEngine, so the route-deviation map respects the current user's mapProvider setting. */
export function RouteDeviationMapEngine({ provider = "google", ...props }: Props) {
    if (provider === "maplibre") {
        return <RouteDeviationMapLibre {...props} />
    }
    return <RouteDeviationMapGoogle {...props} />
}
