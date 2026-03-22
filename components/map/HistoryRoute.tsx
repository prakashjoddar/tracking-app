"use client"

import { Polyline } from "@react-google-maps/api"
import { useHistoryStore } from "@/store/history-store"

export default function HistoryRoute() {

    const points = useHistoryStore((s) => s.points)

    const path = points.map((p) => ({
        lat: p.latitude,
        lng: p.longitude,
    }))

    if (!points.length) return null

    return (
        <Polyline
            path={path}
            options={{
                strokeColor: "#ff6600",
                strokeWeight: 4,
            }}
        />
    )
}