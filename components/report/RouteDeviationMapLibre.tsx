"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"

const MAP_STYLES = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

const PLANNED_SOURCE = "route-deviation-planned"
const PLANNED_LAYER = "route-deviation-planned-layer"
const ACTUAL_SOURCE = "route-deviation-actual"
const ACTUAL_LAYER = "route-deviation-actual-layer"
const DEVIATED_SOURCE = "route-deviation-points"
const DEVIATED_LAYER = "route-deviation-points-layer"

type Props = {
    plannedPath: [number, number][]
    actualPath: [number, number][]
    deviatedIndices: Set<number>
}

function lineFeature(path: [number, number][]): GeoJSON.Feature<GeoJSON.LineString> {
    return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } }
}

function pointsFeature(points: [number, number][]): GeoJSON.FeatureCollection<GeoJSON.Point> {
    return {
        type: "FeatureCollection",
        features: points.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p } })),
    }
}

export function RouteDeviationMapLibre({ plannedPath, actualPath, deviatedIndices }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
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
            map.addSource(PLANNED_SOURCE, { type: "geojson", data: lineFeature([]) })
            map.addLayer({
                id: PLANNED_LAYER, type: "line", source: PLANNED_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#2563eb", "line-width": 4 },
            })
            map.addSource(ACTUAL_SOURCE, { type: "geojson", data: lineFeature([]) })
            map.addLayer({
                id: ACTUAL_LAYER, type: "line", source: ACTUAL_SOURCE,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#f59e0b", "line-width": 3 },
            })
            map.addSource(DEVIATED_SOURCE, { type: "geojson", data: pointsFeature([]) })
            map.addLayer({
                id: DEVIATED_LAYER, type: "circle", source: DEVIATED_SOURCE,
                paint: { "circle-radius": 5, "circle-color": "#dc2626", "circle-opacity": 0.9 },
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
        if (!mapReady || !mapRef.current) return
        const map = mapRef.current

        const plannedSource = map.getSource(PLANNED_SOURCE) as maplibregl.GeoJSONSource | undefined
        const actualSource = map.getSource(ACTUAL_SOURCE) as maplibregl.GeoJSONSource | undefined
        const deviatedSource = map.getSource(DEVIATED_SOURCE) as maplibregl.GeoJSONSource | undefined
        plannedSource?.setData(lineFeature(plannedPath))
        actualSource?.setData(lineFeature(actualPath))
        deviatedSource?.setData(pointsFeature(actualPath.filter((_, idx) => deviatedIndices.has(idx))))

        if (plannedPath.length > 0 || actualPath.length > 0) {
            const lngs = plannedPath.concat(actualPath).map((p) => p[0])
            const lats = plannedPath.concat(actualPath).map((p) => p[1])
            map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 60 },
            )
        }
    }, [mapReady, plannedPath, actualPath, deviatedIndices])

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
