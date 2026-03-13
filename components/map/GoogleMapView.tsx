"use client";

import { useFleetMapCamera } from "@/hooks/useFleetMapCamera";
import { VehicleLocation } from "@/lib/types";
import { useVehicleStore } from "@/store/location-store";
import { useMapsStore } from "@/store/maps-store";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import React from "react";
import { TbFocusAuto, TbFocusCentered } from "react-icons/tb";
import { VehicleMarkerManager } from "./VehicleMarkerManager";

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
        libraries: ["marker"],
    });

    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;

        markerManagerRef.current = new VehicleMarkerManager(map);

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

    useFleetMapCamera({
        map: mapRef.current,
        vehicles,
        followVehicleId,
        activeVehicleId: activeVehicle?.vehicleNo || null,
        autoFocus
    });

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