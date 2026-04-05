"use client";

import { useFleetMapCamera } from "@/hooks/useFleetMapCamera";
import { VehicleLocation } from "@/lib/types";
import { useHistoryStore } from "@/store/history-store";
import { useVehicleStore } from "@/store/location-store";
import { useMapsStore } from "@/store/maps-store";
import { useTripStore } from "@/store/trip-store";
import { useGeofenceStore } from "@/store/geofence-store";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { TbFocusAuto, TbFocusCentered } from "react-icons/tb";
import { HistoryReplayManager } from "./HistoryReplayManager";
import { RouteManager } from "./RouteManager";
import { VehicleMarkerManager } from "./VehicleMarkerManager";
import { StopMarkerManager } from "./StopMarkerManager";
import { GeofenceMarkerManager } from "./GeofenceMarkerManager";
import { PlaceSearch } from "./PlaceSearch";
import { RouteSlider } from "./RouteSlider";
;

export function GoogleMapView() {
    const vehicles = useVehicleStore((s) => s.vehicles);

    const followVehicleId = useMapsStore((s) => s.followVehicleId);
    const hoverVehicleId = useMapsStore((s) => s.hoverVehicleId);
    const selectedLocationId = useMapsStore((s) => s.selectedLocationId);

    const autoFocus = useMapsStore((s) => s.autoFocus);
    const setAutoFocus = useMapsStore((s) => s.setAutoFocus);

    const activeVehicleId = followVehicleId || hoverVehicleId;
    const activeVehicle = vehicles.find((v) => v.vehicleNo === activeVehicleId);

    const mapRef = React.useRef<google.maps.Map | null>(null);
    const markerManagerRef = React.useRef<VehicleMarkerManager | null>(null);
    const initialCenter = React.useRef({ lat: 21.1458, lng: 79.0882 });
    const vehicleBufferRef = React.useRef<Map<string, VehicleLocation>>(new Map());
    const historyManagerRef = React.useRef<HistoryReplayManager | null>(null)
    const routeManagerRef = React.useRef<RouteManager | null>(null)
    const stopMarkerManagerRef = React.useRef<StopMarkerManager | null>(null)
    const geofenceMarkerManagerRef = React.useRef<GeofenceMarkerManager | null>(null)
    const lastWaypointRef = React.useRef<string | null>(null)

    const [routeProgress, setRouteProgress] = useState<number>(1)  // default full route

    const historyPoints = useHistoryStore(s => s.points)
    const historyIndex = useHistoryStore(s => s.index)

    const showMap = useTripStore(s => s.showMapOrStopForm)
    const resetTrip = useTripStore(s => s.resetTrip)
    const trips = useTripStore(s => s.trips)
    const selectedTripId = useTripStore(s => s.selectedTripId)
    const editingTripId = useTripStore(s => s.editingTripId)

    const [mapReady, setMapReady] = useState(false)
    const pathname = usePathname()

    // 3. Enable click placement when map is shown on stops page
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)
    const setGeofencePendingLatLng = useGeofenceStore(s => s.setPendingLatLng)

    const isDashboardPage = pathname === "/"
    const isLocationHistoryPage = pathname === "/location-history"
    const isStopsPage = pathname === "/trip/stop"
    const isTripPage = pathname.startsWith("/trip")
    const isGeofencePage = pathname === "/geofence"

    const mapOptions = React.useMemo(() => ({
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
        zoomControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        rotateControl: false,
        scaleControl: true,
    }), []);

    const fitAllVehicles = React.useCallback(() => {
        if (!mapRef.current || vehicles.length === 0) return;

        const bounds = new google.maps.LatLngBounds();

        vehicles.forEach((v) => {
            bounds.extend({
                lat: v.latitude,
                lng: v.longitude,
            });
        });

        mapRef.current.fitBounds(bounds, {
            top: 80,
            bottom: 80,
            left: 80,
            right: 80,
        });
    }, [vehicles]);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
        libraries: ["places", "marker", "geometry"],
    });

    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;

        markerManagerRef.current = new VehicleMarkerManager(map);
        historyManagerRef.current = new HistoryReplayManager(map)
        routeManagerRef.current = new RouteManager(map)
        stopMarkerManagerRef.current = new StopMarkerManager(map)
        geofenceMarkerManagerRef.current = new GeofenceMarkerManager(map)

        setMapReady(true);

        map.addListener("dragstart", () => {
            useMapsStore.getState().setAutoFocus(false);
        });
    };


    React.useEffect(() => {
        vehicles.forEach((v) => {
            vehicleBufferRef.current.set(v.vehicleNo, v);
        });
    }, [vehicles]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (!isDashboardPage) {
                markerManagerRef.current?.updateVehicles([]);
                return;
            }
            const bufferedVehicles = Array.from(vehicleBufferRef.current.values());
            markerManagerRef.current?.updateVehicles(bufferedVehicles);
        }, 800);

        return () => clearInterval(interval);
    }, [isDashboardPage]);

    React.useEffect(() => {
        fitAllVehicles();
    }, []);

    React.useEffect(() => {
        if (!selectedLocationId) {
            fitAllVehicles();
        }
    }, [selectedLocationId]);

    React.useEffect(() => {
        if (!historyManagerRef.current) return
        if (!isLocationHistoryPage) {
            historyManagerRef.current.clear()
            return
        }
        if (historyPoints.length === 0) return
        historyManagerRef.current.loadRoute(historyPoints)
    }, [historyPoints, isLocationHistoryPage])

    React.useEffect(() => {
        if (!historyManagerRef.current) return
        if (!isLocationHistoryPage) return
        if (!historyPoints[historyIndex]) return
        historyManagerRef.current.moveTo(historyPoints[historyIndex])
    }, [historyIndex, isLocationHistoryPage])

    useEffect(() => {
        if (!showMap) return
        if (!routeManagerRef.current) return
        if (!stopMarkerManagerRef.current) return

        const activeTripId = selectedTripId ?? editingTripId
        const activeTrip = trips.find(t => t.id === activeTripId)
        const waypoint = activeTrip?.waypoint ?? null

        // Redraw if waypoint changed (e.g. after Initialize) or not yet drawn
        if (waypoint && waypoint !== lastWaypointRef.current) {
            routeManagerRef.current.drawEncodedRoute(waypoint)
            stopMarkerManagerRef.current.setPath(waypoint)
            lastWaypointRef.current = waypoint
        }

        if (isStopsPage) {
            stopMarkerManagerRef.current.enablePlacementMode((lat, lng) => {
                setPendingLatLng({ lat, lng })
                useTripStore.getState().setShowMapOrStopForm(false)
            })
        } else {
            stopMarkerManagerRef.current.disablePlacementMode()
        }

    }, [showMap, isStopsPage, mapReady, selectedTripId, editingTripId, trips])

    // ── Effect 2: Geofence only (NO showMap guard) ────────────────────────────────
    useEffect(() => {
        if (!mapReady) return                              // 👈 only guard we need
        if (!geofenceMarkerManagerRef.current) return

        if (isGeofencePage) {
            geofenceMarkerManagerRef.current.enablePlacementMode((lat, lng) => {
                setGeofencePendingLatLng({ lat, lng })
            })
        } else {
            geofenceMarkerManagerRef.current.disablePlacementMode()
        }

    }, [isGeofencePage, mapReady])

    const stops = useTripStore(s => s.stops)

    // 4. Sync confirmed stops to map
    useEffect(() => {
        if (!stopMarkerManagerRef.current) return
        stopMarkerManagerRef.current.syncStops(stops)
    }, [stops])

    const geofences = useGeofenceStore(s => s.geofences)
    const geofenceEditingId = useGeofenceStore(s => s.editingGeofenceId)
    const geofencePendingLatLng = useGeofenceStore(s => s.pendingLatLng)
    const geofencePendingRadius = useGeofenceStore(s => s.pendingRadius)
    const geofencePendingColor = useGeofenceStore(s => s.pendingColor)

    // 5. Sync geofences to map — only on geofence page
    useEffect(() => {
        if (!geofenceMarkerManagerRef.current) return
        if (!isGeofencePage) {
            geofenceMarkerManagerRef.current.clearAll()
            return
        }
        geofenceMarkerManagerRef.current.syncGeofences(geofences, geofenceEditingId)

        // fit map to all geofences only when none is selected
        if (geofences.length > 0 && !geofenceEditingId) {
            geofenceMarkerManagerRef.current.fitToGeofences(geofences)
        }
    }, [geofences, geofenceEditingId, mapReady, isGeofencePage])

    // 5b. Zoom in to selected geofence so its circle is visible
    useEffect(() => {
        if (!mapReady || !isGeofencePage || !geofenceEditingId) return
        const gf = geofences.find(g => g.id === geofenceEditingId)
        if (gf) {
            geofenceMarkerManagerRef.current?.zoomToGeofence(gf.latitude, gf.longitude, gf.radius)
        }
    }, [geofenceEditingId, isGeofencePage, mapReady])

    // 6. Sync pending geofence preview
    useEffect(() => {
        if (!geofenceMarkerManagerRef.current) return
        if (geofencePendingLatLng) {
            geofenceMarkerManagerRef.current.updatePendingLocation(
                geofencePendingLatLng.lat,
                geofencePendingLatLng.lng,
                geofencePendingRadius,
                geofencePendingColor
            )
        } else {
            geofenceMarkerManagerRef.current.clearPending()
        }
    }, [geofencePendingLatLng, geofencePendingRadius, geofencePendingColor, mapReady])  // ✅ added mapReady

    // 5. Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMarkerManagerRef.current?.clearAll()
            geofenceMarkerManagerRef.current?.clearAll()
        }
    }, [])

    useEffect(() => {
        if (!isTripPage && routeManagerRef.current) {
            routeManagerRef.current.clearRoute()
            resetTrip()
        }
    }, [isTripPage])

    useFleetMapCamera({
        map: mapRef.current,
        vehicles,
        followVehicleId,
        activeVehicleId: activeVehicle?.vehicleNo || null,
        autoFocus
    });

    const handleProgressChange = useCallback((progress: number): void => {
        setRouteProgress(progress)
        routeManagerRef.current?.drawPartialRoute(progress)
    }, [])

    if (!isLoaded) return <div>Loading map...</div>;

    return (
        <>
            <GoogleMap
                onLoad={onLoad}
                zoom={5}
                center={initialCenter.current}
                mapContainerStyle={{ width: "100%", height: "100%" }}
                options={mapOptions}
            />

            {/* 👇 only show search on stops page */}
            {isStopsPage && showMap && (<>
                <PlaceSearch />
                <RouteSlider
                    progress={routeProgress}
                    onChange={handleProgressChange}
                />
            </>
            )}

            {activeVehicle && (
                <div className="absolute top-6 right-6 z-40 w-72 rounded-xl border bg-white shadow-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{activeVehicle.vehicleNo}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {activeVehicle.status}
                        </span>
                    </div>

                    <div className="space-y-1 text-sm">
                        <div>Speed: {activeVehicle.speed} km/h</div>
                        <div>Ignition: {activeVehicle.ignition ? "ON" : "OFF"}</div>
                        <div>Signal: {activeVehicle.signalStrength}%</div>
                        <div>Satellites: {activeVehicle.noOfSatellites}</div>
                        <div>
                            Time: {activeVehicle.date} {activeVehicle.time}
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-48 right-3 z-20">
                <button
                    onClick={() => setAutoFocus(!autoFocus)}
                    className={`px-3 py-2 rounded-full shadow text-sm font-medium
          ${autoFocus ? "bg-blue-600 text-white" : "bg-white text-gray-700"}
        `}
                >
                    {autoFocus ? (
                        <TbFocusAuto className="size-5" />
                    ) : (
                        <TbFocusCentered className="size-5" />
                    )}
                </button>
            </div>
        </>
    );
}