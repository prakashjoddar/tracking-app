"use client"

import { Marker } from "@react-google-maps/api"
import { useHistoryStore } from "@/store/history-store"

export default function HistoryVehicleMarker() {

    const points = useHistoryStore((s) => s.points)
    const index = useHistoryStore((s) => s.index)

    if (!points.length) return null

    const p = points[index]

    return (
        <Marker
            position={{
                lat: p.latitude,
                lng: p.longitude,
            }}
        />
    )
}