"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import { decodeEncodedPolyline } from "@/lib/polyline-decode"

const MAP_STYLES = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

const ROUTE_SOURCE = "stop-distance-route"
const ROUTE_LAYER = "stop-distance-route-layer"

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

function lineFeature(path: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> {
    return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } }
}

/** Same rotated-pin shape as RouteManager/StopMarkerManager's pins, plus the distance badge and
 * hover tooltip the Google engine's buildStopMarkerContent shows. */
function buildStopMarkerContent(sequence: number, name: string, distanceKm: number, isStart: boolean): HTMLElement {
    const wrapper = document.createElement("div")
    wrapper.style.cssText = "display: flex; flex-direction: column; align-items: center;"

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

    const pin = document.createElement("div")
    pin.style.cssText = `
        width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        background: ${isStart ? "#16a34a" : "#2563eb"}; border: 2px solid ${isStart ? "#15803d" : "#1d4ed8"};
        display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `
    const label = document.createElement("span")
    label.textContent = String(sequence)
    label.style.cssText = "transform: rotate(45deg); color: #fff; font-weight: 700; font-size: 12px;"
    pin.appendChild(label)

    const distanceBadge = document.createElement("div")
    distanceBadge.textContent = isStart ? "Start" : `${distanceKm.toFixed(2)} km`
    distanceBadge.style.cssText = `
        margin-top: 2px; background: white; color: #334155; font-size: 10px; font-weight: 600;
        padding: 1px 6px; border-radius: 999px; border: 1px solid #cbd5e1; white-space: nowrap;
        box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    `

    wrapper.appendChild(tooltip)
    wrapper.appendChild(caret)
    wrapper.appendChild(pin)
    wrapper.appendChild(distanceBadge)

    wrapper.addEventListener("mouseover", () => { tooltip.style.opacity = "1"; caret.style.opacity = "1" })
    wrapper.addEventListener("mouseout", () => { tooltip.style.opacity = "0"; caret.style.opacity = "0" })

    return wrapper
}

export function StopDistanceMapLibre({ rows, waypoint }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<maplibregl.Marker[]>([])
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
            map.addSource(ROUTE_SOURCE, { type: "geojson", data: lineFeature([]) })
            map.addLayer({
                id: ROUTE_LAYER, type: "line", source: ROUTE_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#2563eb", "line-width": 4 },
            })

            mapRef.current = map
            setMapReady(true)
            // The container can be zero-sized at the moment maplibregl.Map is constructed (e.g.
            // its flex-1 column hasn't settled yet on first paint) — maplibre never notices a
            // later resize on its own, so the canvas stays stuck at whatever size it first saw.
            map.resize()
        })

        const resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
            markersRef.current.forEach((m) => m.remove())
            markersRef.current = []
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

        const routePath = waypoint ? decodeEncodedPolyline(waypoint) : []
        const routeSource = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined
        routeSource?.setData(lineFeature(routePath))

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = rows.map((r) =>
            new maplibregl.Marker({ element: buildStopMarkerContent(r.sequence, r.name, r.distanceKm, r.distanceKm === 0) })
                .setLngLat([r.longitude, r.latitude])
                .addTo(map),
        )

        const lngs = rows.map((r) => r.longitude).concat(routePath.map((p) => p[0]))
        const lats = rows.map((r) => r.latitude).concat(routePath.map((p) => p[1]))
        if (lngs.length > 0) {
            map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 60 },
            )
        }
    }, [mapReady, rows, waypoint])

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
