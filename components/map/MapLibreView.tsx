"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, CarFront, ShieldCheck, Phone, MapPin } from "lucide-react";
import { TbFocusAuto, TbFocusCentered } from "react-icons/tb";
import { useActiveTrip } from "@/hooks/useActiveTrip";
import { useTripStops } from "@/hooks/useTripStops";
import { useOrgGeofences } from "@/hooks/useOrgGeofences";
import { useFleetMapCameraMapLibre } from "@/hooks/useFleetMapCameraMapLibre";
import { VehicleLocation } from "@/lib/types";
import { resolveUserPhotoUrl } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { useVehicleStore } from "@/store/location-store";
import { useMapsStore } from "@/store/maps-store";
import { useGeofenceStore } from "@/store/geofence-store";
import { useTripStore } from "@/store/trip-store";
import { useHistoryStore } from "@/store/history-store";
import { VehicleMarkerManager } from "./maplibre/VehicleMarkerManager";
import { RouteManager } from "./maplibre/RouteManager";
import { GeofenceMarkerManager } from "./maplibre/GeofenceMarkerManager";
import { StopMarkerManager } from "./maplibre/StopMarkerManager";
import { HistoryReplayManager } from "./maplibre/HistoryReplayManager";
import { PlaceSearch } from "./PlaceSearch";
import { RouteSlider } from "./RouteSlider";

const MAP_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

export function MapLibreView() {
  const vehicles = useVehicleStore((s) => s.vehicles);

  const followVehicleId = useMapsStore((s) => s.followVehicleId);
  const hoverVehicleId = useMapsStore((s) => s.hoverVehicleId);
  const selectedLocationId = useMapsStore((s) => s.selectedLocationId);

  const autoFocus = useMapsStore((s) => s.autoFocus);
  const setAutoFocus = useMapsStore((s) => s.setAutoFocus);

  const activeVehicleId = followVehicleId || hoverVehicleId;
  const activeVehicle = vehicles.find((v) => v.vehicleNo === activeVehicleId);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerManagerRef = React.useRef<VehicleMarkerManager | null>(null);
  const routeManagerRef = React.useRef<RouteManager | null>(null);
  const geofenceMarkerManagerRef = React.useRef<GeofenceMarkerManager | null>(null);
  const stopMarkerManagerRef = React.useRef<StopMarkerManager | null>(null);
  const historyManagerRef = React.useRef<HistoryReplayManager | null>(null);
  const vehicleBufferRef = React.useRef<Map<string, VehicleLocation>>(new Map());
  const lastWaypointRef = React.useRef<string | null>(null);

  const [hideOtherVehicles, setHideOtherVehicles] = useState(false); // dashboard toggle — off by default
  const [showGeofences, setShowGeofences] = useState(false); // dashboard toggle — off by default
  const [routeProgress, setRouteProgress] = useState<number>(1); // default full route
  const [mapReady, setMapReady] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const isLiveFleetPage = pathname === "/live-fleet";
  const isGeofencePage = pathname === "/geofence";
  const isStopsPage = pathname === "/trip/stop";
  const isTripPage = pathname.startsWith("/trip");
  const isLocationHistoryPage = pathname === "/location-history";

  const setGeofencePendingLatLng = useGeofenceStore((s) => s.setPendingLatLng);

  const showMap = useTripStore((s) => s.showMapOrStopForm);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const trips = useTripStore((s) => s.trips);
  const selectedTripId = useTripStore((s) => s.selectedTripId);
  const editingTripId = useTripStore((s) => s.editingTripId);
  const setPendingLatLng = useTripStore((s) => s.setPendingLatLng);

  // ── map init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light,
      center: [79.0882, 21.1458],
      zoom: 5,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("dragstart", () => setAutoFocus(false));

    map.on("load", () => {
      markerManagerRef.current = new VehicleMarkerManager(map);
      routeManagerRef.current = new RouteManager(map);
      geofenceMarkerManagerRef.current = new GeofenceMarkerManager(map);
      stopMarkerManagerRef.current = new StopMarkerManager(map);
      historyManagerRef.current = new HistoryReplayManager(map);
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      markerManagerRef.current?.clear();
      routeManagerRef.current?.clearRoute();
      geofenceMarkerManagerRef.current?.clearAll();
      stopMarkerManagerRef.current?.clearAll();
      historyManagerRef.current?.clear();
      map.remove();
      mapRef.current = null;
      markerManagerRef.current = null;
      routeManagerRef.current = null;
      geofenceMarkerManagerRef.current = null;
      stopMarkerManagerRef.current = null;
      historyManagerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light);
  }, [resolvedTheme]);

  const fitAllVehicles = React.useCallback(() => {
    if (!mapRef.current || vehicles.length === 0) return;
    const lngs = vehicles.map((v) => v.longitude);
    const lats = vehicles.map((v) => v.latitude);
    mapRef.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80 },
    );
  }, [vehicles]);

  // ── vehicle buffer + 800ms marker refresh (mirrors GoogleMapView) ─
  useEffect(() => {
    const currentVehicleNos = new Set(vehicles.map((v) => v.vehicleNo));
    for (const vehicleNo of Array.from(vehicleBufferRef.current.keys())) {
      if (!currentVehicleNos.has(vehicleNo)) vehicleBufferRef.current.delete(vehicleNo);
    }
    vehicles.forEach((v) => vehicleBufferRef.current.set(v.vehicleNo, v));
  }, [vehicles]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLiveFleetPage) {
        markerManagerRef.current?.updateVehicles([]);
        return;
      }
      let bufferedVehicles = Array.from(vehicleBufferRef.current.values());
      if (hideOtherVehicles && selectedLocationId) {
        bufferedVehicles = bufferedVehicles.filter((v) => v.vehicleNo === selectedLocationId);
      }
      markerManagerRef.current?.updateVehicles(bufferedVehicles);
    }, 800);

    return () => clearInterval(interval);
  }, [isLiveFleetPage, hideOtherVehicles, selectedLocationId]);

  useEffect(() => {
    if (mapReady) fitAllVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    if (!selectedLocationId) fitAllVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // Turn these toggles off whenever the vehicle is deselected.
  useEffect(() => {
    if (!selectedLocationId) {
      setHideOtherVehicles(false);
      setShowGeofences(false);
    }
  }, [selectedLocationId]);

  // ── Dashboard: active trip route ────────────────────────────────
  const activeTrip = useActiveTrip(isLiveFleetPage ? selectedLocationId : null);
  const activeTripWaypoint = activeTrip?.waypoint ?? null;

  useEffect(() => {
    if (!isLiveFleetPage || !mapReady || !routeManagerRef.current) return;
    if (activeTripWaypoint) {
      routeManagerRef.current.drawEncodedRoute(activeTripWaypoint);
    } else {
      routeManagerRef.current.clearRoute();
    }
  }, [activeTripWaypoint, mapReady, isLiveFleetPage]);

  useFleetMapCameraMapLibre({
    map: mapRef.current,
    vehicles,
    followVehicleId,
    activeVehicleId: activeVehicle?.vehicleNo || null,
    autoFocus,
  });

  // ── Geofence placement mode (geofence page only) ──────────────────
  useEffect(() => {
    if (!mapReady || !geofenceMarkerManagerRef.current) return;
    if (isGeofencePage) {
      geofenceMarkerManagerRef.current.enablePlacementMode((lat, lng) => {
        setGeofencePendingLatLng({ lat, lng });
      });
    } else {
      geofenceMarkerManagerRef.current.disablePlacementMode();
    }
  }, [isGeofencePage, mapReady, setGeofencePendingLatLng]);

  const geofences = useGeofenceStore((s) => s.geofences);
  const geofenceEditingId = useGeofenceStore((s) => s.editingGeofenceId);
  const geofencePendingLatLng = useGeofenceStore((s) => s.pendingLatLng);
  const geofencePendingRadius = useGeofenceStore((s) => s.pendingRadius);
  const geofencePendingColor = useGeofenceStore((s) => s.pendingColor);
  const geofenceLocateRequestId = useGeofenceStore((s) => s.locateRequestId);

  // Sync geofences to map — on the geofence page, or the dashboard toggle.
  const showGeofencesOnLiveFleet = isLiveFleetPage && !!selectedLocationId && showGeofences;
  useOrgGeofences(showGeofencesOnLiveFleet);

  useEffect(() => {
    if (!geofenceMarkerManagerRef.current) return;
    if (!isGeofencePage && !showGeofencesOnLiveFleet) {
      geofenceMarkerManagerRef.current.clearAll();
      return;
    }
    geofenceMarkerManagerRef.current.syncGeofences(geofences, geofenceEditingId);

    if (isGeofencePage && geofences.length > 0 && !geofenceEditingId) {
      geofenceMarkerManagerRef.current.fitToGeofences(geofences);
    }
  }, [geofences, geofenceEditingId, mapReady, isGeofencePage, showGeofencesOnLiveFleet]);

  // Zoom in to the selected geofence so its circle is visible.
  useEffect(() => {
    if (!mapReady || !isGeofencePage || !geofenceEditingId) return;
    const gf = geofences.find((g) => g.id === geofenceEditingId);
    if (gf) {
      geofenceMarkerManagerRef.current?.zoomToGeofence(gf.latitude, gf.longitude, gf.radius);
    }
  }, [geofenceEditingId, isGeofencePage, mapReady]);

  // Sync pending geofence preview (the form's live radius/color/location preview).
  useEffect(() => {
    if (!geofenceMarkerManagerRef.current) return;
    if (geofencePendingLatLng) {
      geofenceMarkerManagerRef.current.updatePendingLocation(
        geofencePendingLatLng.lat, geofencePendingLatLng.lng,
        geofencePendingRadius, geofencePendingColor,
      );
    } else {
      geofenceMarkerManagerRef.current.clearPending();
    }
  }, [geofencePendingLatLng, geofencePendingRadius, geofencePendingColor, mapReady]);

  // "Locate" button in the geofence form — recenter on demand.
  useEffect(() => {
    if (geofenceLocateRequestId === 0) return; // skip the initial mount value
    if (!mapReady || !geofencePendingLatLng) return;
    geofenceMarkerManagerRef.current?.zoomToGeofence(
      geofencePendingLatLng.lat, geofencePendingLatLng.lng, geofencePendingRadius,
    );
  }, [geofenceLocateRequestId]);

  // ── Trip waypoint + stop placement mode ────────────────────────────
  useEffect(() => {
    if (!showMap || !routeManagerRef.current || !stopMarkerManagerRef.current) return;

    const activeTripId = selectedTripId ?? editingTripId;
    const activeTripForRoute = trips.find((t) => t.id === activeTripId);
    const waypoint = activeTripForRoute?.waypoint ?? null;

    if (waypoint && waypoint !== lastWaypointRef.current) {
      routeManagerRef.current.drawEncodedRoute(waypoint);
      stopMarkerManagerRef.current.setPath(waypoint);
      lastWaypointRef.current = waypoint;
    }

    if (isStopsPage) {
      stopMarkerManagerRef.current.enablePlacementMode((lat, lng) => {
        setPendingLatLng({ lat, lng });
        useTripStore.getState().setShowMapOrStopForm(false);
      });
    } else {
      stopMarkerManagerRef.current.disablePlacementMode();
    }
  }, [showMap, isStopsPage, mapReady, selectedTripId, editingTripId, trips, setPendingLatLng]);

  const stops = useTripStore((s) => s.stops);
  const focusStopId = useTripStore((s) => s.focusStopId);
  const focusStopRequestId = useTripStore((s) => s.focusStopRequestId);

  // Sync confirmed stops to map — editor-only. `stops` is a page-agnostic global store, so
  // without the isStopsPage gate the same array gets drawn as plain blue pins on every page,
  // including on top of the Dashboard's own red "S#" trip-stop pins (syncTripStopMarkers).
  useEffect(() => {
    if (!stopMarkerManagerRef.current) return;
    stopMarkerManagerRef.current.syncStops(isStopsPage ? stops : []);
    // mapReady: unlike Google's synchronous init, the manager ref only exists after the async
    // "load" event — without this, stops fetched before that event never get a re-sync.
  }, [stops, mapReady, isStopsPage]);

  // Card click on the stop list — pan/zoom the map to that stop.
  useEffect(() => {
    if (focusStopRequestId === 0) return; // skip the initial mount value
    if (!mapReady) return;
    const stop = stops.find((s) => s.id === focusStopId);
    if (!stop) return;
    stopMarkerManagerRef.current?.zoomToStop(stop.latitude, stop.longitude);
  }, [focusStopRequestId]);

  // Dashboard trip stop pins (read-only, shown while a trip is active).
  const tripStops = useTripStops(isLiveFleetPage ? (activeTrip?.tripId ?? null) : null);
  useEffect(() => {
    if (!isLiveFleetPage || !mapReady || !stopMarkerManagerRef.current) return;
    if (activeTripWaypoint && tripStops.length > 0) {
      stopMarkerManagerRef.current.syncTripStopMarkers(tripStops);
    } else {
      stopMarkerManagerRef.current.clearTripStopMarkers();
    }
  }, [tripStops, activeTripWaypoint, mapReady, isLiveFleetPage]);

  useEffect(() => {
    if (!isTripPage && routeManagerRef.current) {
      routeManagerRef.current.clearRoute();
      resetTrip();
    }
  }, [isTripPage]);

  const handleProgressChange = useCallback((progress: number): void => {
    setRouteProgress(progress);
    routeManagerRef.current?.drawPartialRoute(progress);
  }, []);

  // ── Location history replay ─────────────────────────────────────
  const historyPoints = useHistoryStore((s) => s.points);
  const historyIndex = useHistoryStore((s) => s.index);

  useEffect(() => {
    if (!historyManagerRef.current) return;
    if (!isLocationHistoryPage) {
      historyManagerRef.current.clear();
      return;
    }
    if (historyPoints.length === 0) return;
    historyManagerRef.current.loadRoute(historyPoints);
    // mapReady: the manager ref only exists after the async "load" event — without this, points
    // fetched before that event never get a re-sync (same class of bug as the stops effect above).
  }, [historyPoints, isLocationHistoryPage, mapReady]);

  useEffect(() => {
    if (!historyManagerRef.current) return;
    if (!isLocationHistoryPage) return;
    if (!historyPoints[historyIndex]) return;
    historyManagerRef.current.moveTo(historyPoints[historyIndex]);
  }, [historyIndex, isLocationHistoryPage, mapReady]);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {isStopsPage && showMap && (
        <>
          <PlaceSearch />
          <RouteSlider progress={routeProgress} onChange={handleProgressChange} />
        </>
      )}

      {activeVehicle && (
        <div className="absolute top-6 right-6 z-40 w-72 rounded-xl border bg-white shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{activeVehicle.vehicleNo}</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{activeVehicle.status}</span>
          </div>

          <div className="space-y-1 text-sm">
            <div>Speed: {activeVehicle.speed} km/h</div>
            <div>Ignition: {activeVehicle.ignition ? "ON" : "OFF"}</div>
            <div>Signal: {activeVehicle.signalStrength}%</div>
            <div>Satellites: {activeVehicle.noOfSatellites}</div>
            <div>Time: {activeVehicle.date} {formatTime(activeVehicle.time)}</div>
          </div>
        </div>
      )}

      {activeVehicle &&
        activeTrip &&
        activeTrip.vehicleNo === activeVehicle.vehicleNo &&
        (activeTrip.drivers.length > 0 || activeTrip.supervisors.length > 0) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 rounded-xl border bg-white shadow-xl px-4 py-3 max-w-[calc(100%-2rem)] overflow-x-auto">
            {activeTrip.drivers.map((d) => {
              const photo = resolveUserPhotoUrl(d.photoUrl);
              return (
                <div key={d.id} className="flex items-center gap-2 shrink-0">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="size-9 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="size-9 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                      <CarFront className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Driver</p>
                    <p className="text-sm font-medium truncate">{d.firstName} {d.lastName}</p>
                    {d.mobileNo && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={10} /> {d.mobileNo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {activeTrip.drivers.length > 0 && activeTrip.supervisors.length > 0 && (
              <div className="w-px self-stretch bg-gray-200 shrink-0" />
            )}

            {activeTrip.supervisors.map((s) => {
              const photo = resolveUserPhotoUrl(s.photoUrl);
              return (
                <div key={s.id} className="flex items-center gap-2 shrink-0">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="size-9 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="size-9 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Supervisor</p>
                    <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                    {s.mobileNo && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={10} /> {s.mobileNo}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <div className="absolute bottom-48 right-3 z-20 flex flex-col gap-2 items-end">
        {isLiveFleetPage && selectedLocationId && (
          <>
            <button
              onClick={() => setHideOtherVehicles((v) => !v)}
              title={hideOtherVehicles ? "Show all vehicles" : "Hide other vehicles"}
              className={`px-3 py-2 rounded-full shadow text-sm font-medium
              ${hideOtherVehicles ? "bg-blue-600 text-white" : "bg-white text-gray-700"}
            `}
            >
              {hideOtherVehicles ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
            <button
              onClick={() => setShowGeofences((v) => !v)}
              title={showGeofences ? "Hide geofences" : "Show geofences"}
              className={`px-3 py-2 rounded-full shadow text-sm font-medium
              ${showGeofences ? "bg-blue-600 text-white" : "bg-white text-gray-700"}
            `}
            >
              <MapPin className="size-5" />
            </button>
          </>
        )}
        <button
          onClick={() => setAutoFocus(!autoFocus)}
          title={autoFocus ? "Disable auto focus" : "Enable auto focus"}
          className={`px-3 py-2 rounded-full shadow text-sm font-medium
          ${autoFocus ? "bg-blue-600 text-white" : "bg-white text-gray-700"}
        `}
        >
          {autoFocus ? <TbFocusAuto className="size-5" /> : <TbFocusCentered className="size-5" />}
        </button>
      </div>
    </>
  );
}
