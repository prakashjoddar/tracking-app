"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GoogleMap, useLoadScript } from "@react-google-maps/api"
import { VehicleLocation } from "@/lib/types"
import { MapPin } from "lucide-react"

type Props = {
    vehicle: VehicleLocation | null
}

const mapOptions = {
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
    zoomControl: true,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    rotateControl: false,
    scaleControl: false,
}

const initialCenter = { lat: 21.1458, lng: 79.0882 }

/**
 * Single-vehicle marker only — no trip route, stops, or geofences — for the Dashboard's "latest
 * running vehicles" widget. Deliberately its own small component rather than reusing GoogleMapView
 * (that component always renders the whole fleet plus trip/stop/geofence overlays tied to global
 * stores). Same provider-switch pattern as StopProposalMapEngine/StopDistanceMapEngine.
 */
export function VehicleMiniMapGoogle({ vehicle }: Props) {
    const mapRef = useRef<google.maps.Map | null>(null)
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
    const [mapReady, setMapReady] = useState(false)

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: ["marker"],
    })

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map
        setMapReady(true)
    }, [])

    useEffect(() => {
        return () => {
            if (markerRef.current) markerRef.current.map = null
        }
    }, [])

    useEffect(() => {
        if (!mapReady || !mapRef.current) return

        if (!vehicle) {
            if (markerRef.current) markerRef.current.map = null
            markerRef.current = null
            return
        }

        const position = { lat: vehicle.latitude, lng: vehicle.longitude }
        const pin = new google.maps.marker.PinElement({
            background: "#16a34a",
            borderColor: "#15803d",
            glyphColor: "#fff",
        })

        if (markerRef.current) {
            markerRef.current.position = position
            markerRef.current.content = pin.element
        } else {
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                map: mapRef.current,
                position,
                content: pin.element,
            })
        }

        mapRef.current.panTo(position)
        mapRef.current.setZoom(15)
    }, [mapReady, vehicle])

    if (loadError) {
        return <div className="flex h-full w-full items-center justify-center text-sm text-red-600">Failed to load Google Maps</div>
    }

    return (
        <div className="relative w-full h-full">
            {isLoaded ? (
                <GoogleMap onLoad={onLoad} zoom={5} center={initialCenter} mapContainerStyle={{ width: "100%", height: "100%" }} options={mapOptions} />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Loading map...</div>
            )}

            {isLoaded && !vehicle && (
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
