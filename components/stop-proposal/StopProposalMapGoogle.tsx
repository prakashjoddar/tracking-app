"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GoogleMap, useLoadScript } from "@react-google-maps/api"
import { fetchStopProposalContext } from "@/lib/api"
import { StopProposal, Stop } from "@/lib/types"
import { RouteManager } from "@/components/map/RouteManager"
import { StopMarkerManager } from "@/components/map/StopMarkerManager"
import { AlertTriangle, Loader2, MapPin } from "lucide-react"

type StopProposalMapGoogleProps = {
    proposal: StopProposal | null
}

const mapOptions = {
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    zoomControl: true,
    mapTypeControl: false,
    fullscreenControl: true,
    streetViewControl: false,
    rotateControl: false,
    scaleControl: true,
}

const initialCenter = { lat: 21.1458, lng: 79.0882 }

/**
 * Google Maps counterpart of StopProposalMap.tsx (the MapLibre version) — same read-only
 * preview: route + existing stops as red "S#" pins (StopMarkerManager.syncTripStopMarkers) plus
 * the requested stop as one distinct amber pin, for orgs whose current user has mapProvider
 * "GOOGLE" (the default) rather than "MAPLIBRE" — see StopProposalMapEngine, mirroring the same
 * provider switch MapEngine already does for the rest of the app.
 */
export function StopProposalMapGoogle({ proposal }: StopProposalMapGoogleProps) {
    const mapRef = useRef<google.maps.Map | null>(null)
    const routeManagerRef = useRef<RouteManager | null>(null)
    const stopMarkerManagerRef = useRef<StopMarkerManager | null>(null)
    const proposedMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [contextLoadError, setContextLoadError] = useState(false)

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: ["places", "marker", "geometry"],
    })

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map
        routeManagerRef.current = new RouteManager(map)
        stopMarkerManagerRef.current = new StopMarkerManager(map)
        setMapReady(true)
    }, [])

    useEffect(() => {
        return () => {
            if (proposedMarkerRef.current) proposedMarkerRef.current.map = null
            routeManagerRef.current?.clearRoute()
            stopMarkerManagerRef.current?.clearAll()
        }
    }, [])

    useEffect(() => {
        if (!mapReady || !routeManagerRef.current || !stopMarkerManagerRef.current) return

        if (proposedMarkerRef.current) {
            proposedMarkerRef.current.map = null
            proposedMarkerRef.current = null
        }

        if (!proposal) {
            routeManagerRef.current.clearRoute()
            stopMarkerManagerRef.current.clearTripStopMarkers()
            return
        }

        let cancelled = false
        setLoading(true)
        setContextLoadError(false)

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

                // NEW_STOP carries its own lat/lng; TRANSFER has none — highlight the target
                // (existing) stop's location instead, so both kinds get an amber "here" pin.
                let markerPosition: { lat: number; lng: number } | null = null
                if (proposal.type === "TRANSFER") {
                    const target = context.stops.find((s) => s.id === proposal.targetStopId)
                    if (target && target.latitude != null && target.longitude != null) {
                        markerPosition = { lat: target.latitude, lng: target.longitude }
                    }
                } else if (proposal.latitude != null && proposal.longitude != null) {
                    markerPosition = { lat: proposal.latitude, lng: proposal.longitude }
                }
                if (markerPosition) {
                    const pin = new google.maps.marker.PinElement({
                        background: "#f59e0b",
                        borderColor: "#b45309",
                        glyphColor: "#fff",
                        glyph: "!",
                    })
                    proposedMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
                        map: mapRef.current,
                        position: markerPosition,
                        content: pin.element,
                        title: proposal.type === "TRANSFER" ? "Target stop" : "Requested stop",
                    })
                }

                // Fit bounds to the full route + every plotted stop + the proposed pin — the
                // requested stop can legitimately sit off the existing route.
                const bounds = new google.maps.LatLngBounds()
                let hasBounds = false
                if (context.waypoint) {
                    google.maps.geometry.encoding.decodePath(context.waypoint).forEach((p) => {
                        bounds.extend(p)
                        hasBounds = true
                    })
                }
                plottedStops.forEach((s) => {
                    bounds.extend({ lat: s.latitude, lng: s.longitude })
                    hasBounds = true
                })
                if (markerPosition) {
                    bounds.extend(markerPosition)
                    hasBounds = true
                }
                if (hasBounds) mapRef.current.fitBounds(bounds, 60)
            })
            .catch((e) => {
                if (cancelled) return
                console.error("Failed to load trip context for stop request map", e)
                setContextLoadError(true)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [proposal, mapReady])

    if (loadError) {
        return (
            <div className="flex h-full w-full items-center justify-center text-sm text-red-600">
                Failed to load Google Maps — check your API key/network connection and reload.
            </div>
        )
    }

    return (
        <div className="relative w-full h-full">
            {isLoaded ? (
                <GoogleMap
                    onLoad={onLoad}
                    zoom={5}
                    center={initialCenter}
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    options={mapOptions}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Loading map...</div>
            )}

            {isLoaded && !proposal && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 pointer-events-none">
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

            {!loading && contextLoadError && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-white shadow px-3 py-1.5 text-xs font-medium text-red-600">
                    <AlertTriangle size={13} /> Could not load route/stops for this request
                </div>
            )}
        </div>
    )
}
