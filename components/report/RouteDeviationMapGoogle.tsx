"use client"

import { useCallback, useEffect, useState } from "react"
import { GoogleMap, useLoadScript, Polyline, Circle } from "@react-google-maps/api"

type Props = {
    plannedPath: [number, number][]
    actualPath: [number, number][]
    deviatedIndices: Set<number>
}

function toLatLngLiteral([lng, lat]: [number, number]): google.maps.LatLngLiteral {
    return { lat, lng }
}

export function RouteDeviationMapGoogle({ plannedPath, actualPath, deviatedIndices }: Props) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    })

    // Tracked as state (not a plain ref) so the fitBounds effect below is
    // guaranteed to re-run once the map actually becomes available — GoogleMap's
    // onLoad can fire after this component's effects have already committed,
    // and a ref mutation alone wouldn't schedule a re-run.
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const onMapLoad = useCallback((m: google.maps.Map) => { setMap(m) }, [])

    useEffect(() => {
        if (!map || !isLoaded || (plannedPath.length === 0 && actualPath.length === 0)) return
        const bounds = new google.maps.LatLngBounds()
        plannedPath.forEach((p) => bounds.extend(toLatLngLiteral(p)))
        actualPath.forEach((p) => bounds.extend(toLatLngLiteral(p)))
        map.fitBounds(bounds, 60)
    }, [map, isLoaded, plannedPath, actualPath])

    if (!isLoaded) {
        return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading map...</div>
    }

    const center = actualPath[0] ? toLatLngLiteral(actualPath[0]) : { lat: 0, lng: 0 }

    return (
        <GoogleMap onLoad={onMapLoad} mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={13}>
            {plannedPath.length > 0 && (
                <Polyline path={plannedPath.map(toLatLngLiteral)} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
            )}
            {actualPath.length > 0 && (
                <Polyline path={actualPath.map(toLatLngLiteral)} options={{ strokeColor: "#f59e0b", strokeWeight: 3 }} />
            )}
            {actualPath.map((p, idx) => deviatedIndices.has(idx) && (
                <Circle
                    key={idx}
                    center={toLatLngLiteral(p)}
                    radius={12}
                    options={{ fillColor: "#dc2626", fillOpacity: 0.9, strokeColor: "#dc2626", strokeWeight: 0 }}
                />
            ))}
        </GoogleMap>
    )
}
