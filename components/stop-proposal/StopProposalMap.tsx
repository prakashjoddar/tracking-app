"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import { fetchStopProposalContext } from "@/lib/api"
import { decodeEncodedPolyline } from "@/lib/polyline-decode"
import { StopProposal, Stop } from "@/lib/types"
import { RouteManager } from "@/components/map/maplibre/RouteManager"
import { StopMarkerManager } from "@/components/map/maplibre/StopMarkerManager"
import { Loader2, MapPin } from "lucide-react"

const MAP_STYLES = {
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}

type StopProposalMapProps = {
    proposal: StopProposal | null
}

/**
 * Read-only preview for the stop-request review page — the trip's route + its existing stops
 * (StopMarkerManager's red "S#" pins, same as the dashboard's active-trip view) plus the
 * requested stop plotted as one extra, distinctly colored marker, so an admin can see exactly
 * where it would land relative to the route before approving. Deliberately its own small
 * component rather than reusing the page-agnostic MapLibreView — that component branches its
 * whole behavior off the current pathname/Zustand trip-store, which has no notion of "a proposal
 * that isn't the trip currently being edited".
 */
export function StopProposalMap({ proposal }: StopProposalMapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const routeManagerRef = useRef<RouteManager | null>(null)
    const stopMarkerManagerRef = useRef<StopMarkerManager | null>(null)
    const proposedMarkerRef = useRef<maplibregl.Marker | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [loading, setLoading] = useState(false)
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
            routeManagerRef.current = new RouteManager(map)
            stopMarkerManagerRef.current = new StopMarkerManager(map)
            mapRef.current = map
            setMapReady(true)
        })

        return () => {
            proposedMarkerRef.current?.remove()
            routeManagerRef.current?.clearRoute()
            stopMarkerManagerRef.current?.clearAll()
            map.remove()
            mapRef.current = null
            routeManagerRef.current = null
            stopMarkerManagerRef.current = null
            setMapReady(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!mapRef.current) return
        mapRef.current.setStyle(resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light)
    }, [resolvedTheme])

    useEffect(() => {
        if (!mapReady || !routeManagerRef.current || !stopMarkerManagerRef.current) return

        proposedMarkerRef.current?.remove()
        proposedMarkerRef.current = null

        if (!proposal) {
            routeManagerRef.current.clearRoute()
            stopMarkerManagerRef.current.clearTripStopMarkers()
            return
        }

        let cancelled = false
        setLoading(true)

        fetchStopProposalContext(proposal.tripId)
            .then((context) => {
                if (cancelled || !mapRef.current || !routeManagerRef.current || !stopMarkerManagerRef.current) return

                if (context.waypoint) {
                    routeManagerRef.current.drawEncodedRoute(context.waypoint)
                } else {
                    routeManagerRef.current.clearRoute()
                }

                const plottedStops: Stop[] = context.stops
                    .filter((s) => s.latitude != null && s.longitude != null)
                    .map((s) => ({
                        id: s.id,
                        name: s.name,
                        enable: true,
                        type: "BUS_STOP",
                        latitude: s.latitude as number,
                        longitude: s.longitude as number,
                        studentId: [],
                        tripId: proposal.tripId,
                        sequence: s.sequence,
                    }))
                stopMarkerManagerRef.current.syncTripStopMarkers(plottedStops)

                if (proposal.latitude != null && proposal.longitude != null) {
                    proposedMarkerRef.current = new maplibregl.Marker({ element: buildProposedMarker() })
                        .setLngLat([proposal.longitude, proposal.latitude])
                        .addTo(mapRef.current)
                }

                // Fit bounds to the full route + every plotted stop + the proposed pin — rather
                // than relying on drawEncodedRoute's own fitBounds (route only), since the
                // requested stop can legitimately sit off the existing route.
                const routeCoords = context.waypoint ? decodeEncodedPolyline(context.waypoint) : []
                const lngs = routeCoords.map((c) => c[0]).concat(plottedStops.map((s) => s.longitude))
                const lats = routeCoords.map((c) => c[1]).concat(plottedStops.map((s) => s.latitude))
                if (proposal.latitude != null && proposal.longitude != null) {
                    lngs.push(proposal.longitude)
                    lats.push(proposal.latitude)
                }
                if (lngs.length > 0) {
                    mapRef.current.fitBounds(
                        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                        { padding: 60 },
                    )
                }
            })
            .catch((e) => {
                console.error("Failed to load trip context for stop request map", e)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [proposal, mapReady])

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="absolute inset-0" />

            {!proposal && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <MapPin size={28} />
                        <p className="text-sm font-medium">Select a request to preview its location</p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-white shadow px-3 py-1.5 text-xs font-medium text-slate-600">
                    <Loader2 size={13} className="animate-spin" /> Loading route…
                </div>
            )}
        </div>
    )
}

/** Amber pin — same rotated-square pin shape as RouteManager/StopMarkerManager's pins, distinct
 * color and glyph so the requested stop never gets mistaken for one of the numbered existing ones. */
function buildProposedMarker(): HTMLElement {
    const el = document.createElement("div")
    el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        background: #f59e0b; border: 2px solid #b45309; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    `
    const label = document.createElement("span")
    label.textContent = "!"
    label.style.cssText = "transform: rotate(45deg); color: #fff; font-weight: 800; font-size: 15px;"
    el.appendChild(label)
    return el
}
