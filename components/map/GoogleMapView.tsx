"use client";

import { useFleetMapCamera } from "@/hooks/useFleetMapCamera";
import { Stop, VehicleLocation } from "@/lib/types";
import { useHistoryStore } from "@/store/history-store";
import { useVehicleStore } from "@/store/location-store";
import { useMapsStore } from "@/store/maps-store";
import { useTripStore } from "@/store/trip-store";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { TbFocusAuto, TbFocusCentered } from "react-icons/tb";
import { HistoryReplayManager } from "./HistoryReplayManager";
import { RouteManager } from "./RouteManager";
import { VehicleMarkerManager } from "./VehicleMarkerManager";
import { StopMarkerManager } from "./StopMarkerManager";
import { PlaceSearch } from "./PlaceSearch";
import { RouteSlider } from "./RouteSlider";

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
    const routeDrawnRef = React.useRef<boolean>(false)

    const [routeProgress, setRouteProgress] = useState<number>(1)  // default full route

    const historyPoints = useHistoryStore(s => s.points)
    const historyIndex = useHistoryStore(s => s.index)

    const showMap = useTripStore(s => s.showMapOrStopForm)
    const resetTrip = useTripStore(s => s.resetTrip)

    const [mapReady, setMapReady] = useState(false)
    const pathname = usePathname()

    // 3. Enable click placement when map is shown on stops page
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)
    const isStopsPage = pathname === "/trip/stops"

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

        setMapReady(true);

        map.addListener("dragstart", () => {
            useMapsStore.getState().setAutoFocus(false);
        });
    };

    const shouldRecenterMap = (
        map: google.maps.Map,
        lat: number,
        lng: number
    ) => {
        const bounds = map.getBounds();
        if (!bounds) return true;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const latRange = ne.lat() - sw.lat();
        const lngRange = ne.lng() - sw.lng();

        // safe zone (center 40%)
        const safeLatMin = sw.lat() + latRange * 0.3;
        const safeLatMax = ne.lat() - latRange * 0.3;

        const safeLngMin = sw.lng() + lngRange * 0.3;
        const safeLngMax = ne.lng() - lngRange * 0.3;

        return (
            lat < safeLatMin ||
            lat > safeLatMax ||
            lng < safeLngMin ||
            lng > safeLngMax
        );
    };

    React.useEffect(() => {
        vehicles.forEach((v) => {
            vehicleBufferRef.current.set(v.vehicleNo, v);
        });
    }, [vehicles]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const bufferedVehicles = Array.from(vehicleBufferRef.current.values());
            markerManagerRef.current?.updateVehicles(bufferedVehicles);
        }, 800);

        return () => clearInterval(interval);
    }, []);

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
        if (historyPoints.length === 0) return

        historyManagerRef.current.loadRoute(historyPoints)

    }, [historyPoints])

    React.useEffect(() => {

        if (!historyManagerRef.current) return
        if (!historyPoints[historyIndex]) return

        historyManagerRef.current.moveTo(historyPoints[historyIndex])

    }, [historyIndex])

    useEffect(() => {
        if (!showMap) return
        if (!routeManagerRef.current) return
        if (!stopMarkerManagerRef.current) return

        const waypoint = "ko{_CgtgaNN{KmGyLmFoU_Hcm@oJw|@sPuW}\\qOoYalAo`@uwB"

        // 👇 only draw route once — returning from form should not redraw
        if (!routeDrawnRef.current) {
            routeManagerRef.current.drawEncodedRoute(waypoint)
            stopMarkerManagerRef.current.setPath(waypoint)
            routeDrawnRef.current = true
        }

        if (isStopsPage) {
            stopMarkerManagerRef.current.enablePlacementMode((lat, lng, snapToRoute) => {
                const newStop: Stop = {
                    id: crypto.randomUUID(),
                    name: `Stop ${useTripStore.getState().stops.length + 1}`,
                    latitude: lat,
                    longitude: lng,
                    type: "point",
                    enabled: true,
                    snapToRoute,
                }
                useTripStore.getState().addStop(newStop)
                setPendingLatLng({ lat, lng })
            })
        } else {
            stopMarkerManagerRef.current.disablePlacementMode()
        }

    }, [showMap, isStopsPage, mapReady])
    const stops = useTripStore(s => s.stops)

    // 4. Sync confirmed stops to map
    useEffect(() => {
        if (!stopMarkerManagerRef.current) return
        stopMarkerManagerRef.current.syncStops(stops)
    }, [stops])

    // 5. Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMarkerManagerRef.current?.clearAll()
        }
    }, [])

    useEffect(() => {
        const isOnTrips = pathname.startsWith("/trip")

        if (!isOnTrips && routeManagerRef.current) {
            routeManagerRef.current.clearRoute()
            resetTrip()
        }
    }, [pathname])

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