import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { Geofence } from "@/lib/types";
import { useGeofenceStore } from "@/store/geofence-store";

type GeofenceProps = { id: string; color: string; enable: boolean };

function circleFeature(lat: number, lng: number, radiusMeters: number, properties: GeofenceProps): Feature<Polygon, GeofenceProps> {
    const feature = turf.circle([lng, lat], Math.max(radiusMeters, 1) / 1000, { steps: 64, units: "kilometers" });
    feature.properties = properties;
    return feature as Feature<Polygon, GeofenceProps>;
}

function emptyCollection(): FeatureCollection<Polygon, GeofenceProps> {
    return { type: "FeatureCollection", features: [] };
}

/** MapLibre port of components/map/GeofenceMarkerManager.ts — same public API. */
export class GeofenceMarkerManager {
    private map: maplibregl.Map;
    private sourceId = "geofences-source";
    private fillLayerId = "geofences-fill";
    private outlineLayerId = "geofences-outline";
    private pendingSourceId = "pending-geofence-source";
    private pendingFillLayerId = "pending-geofence-fill";
    private pendingOutlineLayerId = "pending-geofence-outline";

    private markers = new Map<string, maplibregl.Marker>();
    private pendingMarker: maplibregl.Marker | null = null;
    private pendingMarkerColor: string | null = null;
    private popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

    private clickHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;
    private ready = false;
    private readyQueue: (() => void)[] = [];

    constructor(map: maplibregl.Map) {
        this.map = map;
        this.ensureLayers();
    }

    private ensureLayers() {
        const setup = () => {
            if (!this.map.getSource(this.sourceId)) {
                this.map.addSource(this.sourceId, { type: "geojson", data: emptyCollection() });
                this.map.addLayer({
                    id: this.fillLayerId, type: "fill", source: this.sourceId,
                    paint: {
                        "fill-color": ["get", "color"],
                        "fill-opacity": ["case", ["get", "enable"], 0.2, 0.05],
                    },
                });
                this.map.addLayer({
                    id: this.outlineLayerId, type: "line", source: this.sourceId,
                    paint: {
                        "line-color": ["get", "color"],
                        "line-opacity": ["case", ["get", "enable"], 0.85, 0.3],
                        "line-width": 2,
                    },
                });

                this.map.on("click", this.fillLayerId, (e) => {
                    const id = e.features?.[0]?.properties?.id;
                    if (id) useGeofenceStore.getState().setEditingGeofence(id);
                });
                this.map.on("mouseenter", this.fillLayerId, () => {
                    this.map.getCanvas().style.cursor = "pointer";
                });
                this.map.on("mouseleave", this.fillLayerId, () => {
                    this.map.getCanvas().style.cursor = "";
                });
            }
            if (!this.map.getSource(this.pendingSourceId)) {
                this.map.addSource(this.pendingSourceId, { type: "geojson", data: emptyCollection() });
                this.map.addLayer({
                    id: this.pendingFillLayerId, type: "fill", source: this.pendingSourceId,
                    paint: { "fill-color": ["get", "color"], "fill-opacity": 0.15 },
                });
                this.map.addLayer({
                    id: this.pendingOutlineLayerId, type: "line", source: this.pendingSourceId,
                    paint: { "line-color": ["get", "color"], "line-opacity": 0.9, "line-width": 2.5 },
                });
            }
            this.ready = true;
            this.readyQueue.forEach((fn) => fn());
            this.readyQueue = [];
        };

        if (this.map.isStyleLoaded()) setup();
        else this.map.once("load", setup);
    }

    private whenReady(fn: () => void) {
        if (this.ready) fn();
        else this.readyQueue.push(fn);
    }

    private setGeofenceData(features: Feature<Polygon, GeofenceProps>[]) {
        this.whenReady(() => {
            const source = this.map.getSource(this.sourceId) as maplibregl.GeoJSONSource | undefined;
            source?.setData({ type: "FeatureCollection", features });
        });
    }

    private setPendingData(feature: Feature<Polygon, GeofenceProps> | null) {
        this.whenReady(() => {
            const source = this.map.getSource(this.pendingSourceId) as maplibregl.GeoJSONSource | undefined;
            source?.setData(feature ? { type: "FeatureCollection", features: [feature] } : emptyCollection());
        });
    }

    // ─── Placement Mode (click to select location) ────────────────────────
    enablePlacementMode(onPlace: (lat: number, lng: number) => void) {
        this.disablePlacementMode();
        this.map.getCanvas().style.cursor = "crosshair";

        this.clickHandler = (e) => onPlace(e.lngLat.lat, e.lngLat.lng);
        this.map.on("click", this.clickHandler);
    }

    disablePlacementMode() {
        if (this.clickHandler) {
            this.map.off("click", this.clickHandler);
            this.clickHandler = null;
        }
        this.map.getCanvas().style.cursor = "";
    }

    // ─── Pending Location Preview ───────────────────────────────────────────
    updatePendingLocation(lat: number, lng: number, radius: number = 150, color: string = "#3b82f6") {
        const currentZoom = this.map.getZoom() ?? 0;
        if (currentZoom < 13) this.zoomToGeofence(lat, lng, radius);

        // Marker color can't be changed in place — recreate only when the color actually changed.
        if (!this.pendingMarker || this.pendingMarkerColor !== color) {
            this.pendingMarker?.remove();
            this.pendingMarker = new maplibregl.Marker({ color }).setLngLat([lng, lat]).addTo(this.map);
            this.pendingMarkerColor = color;
        } else {
            this.pendingMarker.setLngLat([lng, lat]);
        }

        this.setPendingData(circleFeature(lat, lng, radius, { id: "pending", color, enable: true }));
    }

    clearPending() {
        this.pendingMarker?.remove();
        this.pendingMarker = null;
        this.pendingMarkerColor = null;
        this.setPendingData(null);
    }

    // ─── Sync Geofences to Map ────────────────────────────────────────────────
    syncGeofences(geofences: Geofence[], editingId?: string | null) {
        const visible = geofences.filter((g) => g.id && g.id !== editingId);

        const features = visible.map((gf) =>
            circleFeature(gf.latitude, gf.longitude, gf.radius, {
                id: gf.id!, color: gf.color || "#3b82f6", enable: gf.enable,
            }),
        );
        this.setGeofenceData(features);

        const seen = new Set<string>();
        visible.forEach((gf) => {
            seen.add(gf.id!);
            const color = gf.color || "#3b82f6";
            const existing = this.markers.get(gf.id!);
            if (existing) {
                existing.setLngLat([gf.longitude, gf.latitude]);
            } else {
                const marker = new maplibregl.Marker({ color })
                    .setLngLat([gf.longitude, gf.latitude])
                    .addTo(this.map);
                const el = marker.getElement();
                el.style.cursor = "pointer";
                el.addEventListener("click", () => useGeofenceStore.getState().setEditingGeofence(gf.id!));
                el.addEventListener("mouseenter", () => {
                    this.popup.setLngLat([gf.longitude, gf.latitude])
                        .setHTML(`<div style="font-size:12px;font-weight:600;padding:2px">${gf.name}</div>`)
                        .addTo(this.map);
                });
                el.addEventListener("mouseleave", () => this.popup.remove());
                this.markers.set(gf.id!, marker);
            }
        });

        // Remove markers for geofences no longer visible (deleted, or currently being edited).
        for (const [id, marker] of this.markers) {
            if (!seen.has(id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }
    }

    clearAll() {
        this.disablePlacementMode();
        this.popup.remove();
        this.setGeofenceData([]);
        for (const [, marker] of this.markers) marker.remove();
        this.markers.clear();
        this.clearPending();
    }

    // ─── Zoom map to a single geofence so its circle is visible ─────────────
    zoomToGeofence(lat: number, lng: number, radius: number): void {
        const padded = turf.circle([lng, lat], Math.max(radius * 4, 800) / 1000, { steps: 32, units: "kilometers" });
        const bbox = turf.bbox(padded);
        this.map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 80 });
    }

    // ─── Fit map to show all geofences ────────────────────────────────────────
    fitToGeofences(geofences: Geofence[]): void {
        if (geofences.length === 0) return;
        const circles = geofences.map((gf) =>
            turf.circle([gf.longitude, gf.latitude], Math.max(gf.radius, 1) / 1000, { steps: 32, units: "kilometers" }),
        );
        const bbox = turf.bbox({ type: "FeatureCollection", features: circles });
        this.map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 60 });
    }
}
