"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GoogleMap, useLoadScript, Polyline } from "@react-google-maps/api"
import { decodeEncodedPolyline } from "@/lib/polyline-decode"

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
}

// Must be a stable reference — a new array literal on every render makes
// useLoadScript think the requested libraries changed and reload the script.
const MAP_LIBRARIES: "marker"[] = ["marker"]

function buildStopMarkerContent(sequence: number, name: string, distanceKm: number, isStart: boolean): HTMLElement {
    const wrapper = document.createElement("div")
    wrapper.style.cssText = "position: relative; display: flex; flex-direction: column; align-items: center;"

    const tooltip = document.createElement("div")
    tooltip.textContent = name
    tooltip.style.cssText = `
        position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.75); color: white; font-size: 11px; font-weight: 500;
        padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none;
        opacity: 0; transition: opacity 0.15s ease;
    `
    const caret = document.createElement("div")
    caret.style.cssText = `
        position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
        border: 4px solid transparent; border-top-color: rgba(0,0,0,0.75);
        pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
    `

    const pin = new google.maps.marker.PinElement({
        background: isStart ? "#16a34a" : "#2563eb",
        borderColor: isStart ? "#15803d" : "#1d4ed8",
        glyph: String(sequence),
        glyphColor: "#fff",
    })

    const distanceBadge = document.createElement("div")
    distanceBadge.textContent = isStart ? "Start" : `${distanceKm.toFixed(2)} km`
    distanceBadge.style.cssText = `
        margin-top: 2px; background: white; color: #334155; font-size: 10px; font-weight: 600;
        padding: 1px 6px; border-radius: 999px; border: 1px solid #cbd5e1; white-space: nowrap;
        box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    `

    wrapper.appendChild(tooltip)
    wrapper.appendChild(caret)
    wrapper.appendChild(pin.element)
    wrapper.appendChild(distanceBadge)

    wrapper.addEventListener("mouseover", () => { tooltip.style.opacity = "1"; caret.style.opacity = "1" })
    wrapper.addEventListener("mouseout", () => { tooltip.style.opacity = "0"; caret.style.opacity = "0" })

    return wrapper
}

export function StopDistanceMapGoogle({ rows, waypoint }: Props) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: MAP_LIBRARIES,
    })

    // Tracked as state (not a plain ref) so the marker effect below is
    // guaranteed to re-run once the map actually becomes available — GoogleMap's
    // onLoad can fire after this component's effects have already committed,
    // and a ref mutation alone wouldn't schedule a re-run.
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

    const onMapLoad = useCallback((m: google.maps.Map) => { setMap(m) }, [])

    // The trip's actual (road-following) route — same encoded polyline drawn on /trip/stop.
    const routePath = useMemo(
        () => (waypoint ? decodeEncodedPolyline(waypoint) : []),
        [waypoint],
    )

    useEffect(() => {
        if (!map) return

        markersRef.current.forEach((m) => { m.map = null })
        markersRef.current = rows.map((r) => new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: r.latitude, lng: r.longitude },
            content: buildStopMarkerContent(r.sequence, r.name, r.distanceKm, r.distanceKm === 0),
        }))

        const bounds = new google.maps.LatLngBounds()
        rows.forEach((r) => bounds.extend({ lat: r.latitude, lng: r.longitude }))
        routePath.forEach(([lng, lat]) => bounds.extend({ lat, lng }))
        if (!bounds.isEmpty()) map.fitBounds(bounds, 60)

        return () => {
            markersRef.current.forEach((m) => { m.map = null })
            markersRef.current = []
        }
    }, [map, rows, routePath])

    const center = rows[0] ? { lat: rows[0].latitude, lng: rows[0].longitude } : { lat: 0, lng: 0 }

    if (!isLoaded) {
        return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading map...</div>
    }

    return (
        <GoogleMap
            onLoad={onMapLoad}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={13}
            options={{ mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID }}
        >
            {routePath.length > 1 && (
                <Polyline path={routePath.map(([lng, lat]) => ({ lat, lng }))} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
            )}
        </GoogleMap>
    )
}
