"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import { VehicleLocation } from "@/lib/types"
import { MapPin } from "lucide-react"

const MAP_STYLES = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

type Props = {
    vehicle: VehicleLocation | null
}

function buildMarkerEl(): HTMLElement {
    const el = document.createElement("div")
    el.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        background: #16a34a; border: 2px solid #15803d; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    `
    return el
}

/** MapLibre counterpart of VehicleMiniMapGoogle — single-vehicle marker only, no route/stop/geofence layers. */
export function VehicleMiniMapLibre({ vehicle }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light,
            center: [79.0882, 21.1458],
            zoom: 5,
            minZoom: 3,
            maxZoom: 18,
            attributionControl: false,
        })
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

        map.on("load", () => {
            mapRef.current = map
            setMapReady(true)
            // The container can be zero-sized at the moment maplibregl.Map is constructed (e.g. a
            // dashboard card whose layout hasn't settled yet on first paint).
            map.resize()
        })

        const resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
            markerRef.current?.remove()
            markerRef.current = null
            map.remove()
            mapRef.current = null
            setMapReady(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!mapRef.current) return
        mapRef.current.setStyle(resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light)
    }, [resolvedTheme])

    useEffect(() => {
        const map = mapRef.current
        if (!mapReady || !map) return

        if (!vehicle) {
            markerRef.current?.remove()
            markerRef.current = null
            return
        }

        const lngLat: [number, number] = [vehicle.longitude, vehicle.latitude]
        if (markerRef.current) {
            markerRef.current.setLngLat(lngLat)
        } else {
            markerRef.current = new maplibregl.Marker({ element: buildMarkerEl() }).setLngLat(lngLat).addTo(map)
        }
        map.easeTo({ center: lngLat, zoom: 15 })
    }, [mapReady, vehicle])

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            {!vehicle && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <MapPin size={24} />
                        <p className="text-sm font-medium">Select a vehicle to see its location</p>
                    </div>
                </div>
            )}
        </div>
    )
}
