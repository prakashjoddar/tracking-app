import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import { decodeEncodedPolyline } from "@/lib/polyline-decode";
import { Stop } from "@/lib/types";
import { useTripStore } from "@/store/trip-store";

/** MapLibre port of components/map/StopMarkerManager.tsx — same public API. */
export class StopMarkerManager {
    private map: maplibregl.Map;
    private markers = new Map<string, maplibregl.Marker>();
    private tripStopMarkers = new Map<string, maplibregl.Marker>();
    private pendingMarker: maplibregl.Marker | null = null;
    private clickHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;
    private pathLine: ReturnType<typeof turf.lineString> | null = null;

    constructor(map: maplibregl.Map) {
        this.map = map;
    }

    /** Call this after drawEncodedRoute so markers know the path to snap to. */
    setPath(encoded: string) {
        const decoded = decodeEncodedPolyline(encoded);
        this.pathLine = decoded.length >= 2 ? turf.lineString(decoded) : null;
    }

    private snapToPath(lat: number, lng: number): { lat: number; lng: number } {
        if (!this.pathLine) return { lat, lng };
        const snapped = turf.nearestPointOnLine(this.pathLine, turf.point([lng, lat]));
        const [snappedLng, snappedLat] = snapped.geometry.coordinates;
        return { lat: snappedLat, lng: snappedLng };
    }

    // ─── Placement mode ───────────────────────────────────────────────────────
    enablePlacementMode(onPlace: (lat: number, lng: number, snapToRoute: boolean) => void) {
        this.disablePlacementMode();
        this.map.getCanvas().style.cursor = "crosshair";

        this.clickHandler = (e) => {
            const snapToRoute = useTripStore.getState().snapToRoute;
            const position = snapToRoute
                ? this.snapToPath(e.lngLat.lat, e.lngLat.lng)
                : { lat: e.lngLat.lat, lng: e.lngLat.lng };

            onPlace(position.lat, position.lng, snapToRoute);
        };
        this.map.on("click", this.clickHandler);
    }

    disablePlacementMode() {
        if (this.clickHandler) {
            this.map.off("click", this.clickHandler);
            this.clickHandler = null;
        }
        this.map.getCanvas().style.cursor = "";
    }

    // ─── Focus a single stop (card click) ──────────────────────────────────────
    zoomToStop(lat: number, lng: number): void {
        this.map.panTo([lng, lat]);
        const currentZoom = this.map.getZoom() ?? 0;
        if (currentZoom < 17) this.map.setZoom(17);
    }

    // ─── Confirmed stop markers ───────────────────────────────────────────────
    // Numbered by raw array order, not `sequence` — StopList.tsx's cards are numbered the same
    // way (see its `stops.map((stop, index) => ...)`), and its drag-to-reorder (reorderStops)
    // only moves array position; `sequence` isn't recomputed until Save. Sorting by `sequence`
    // here would desync the map's numbers from the list's the moment someone drags a row.
    syncStops(stops: Stop[]) {
        for (const [id, marker] of this.markers) {
            if (!stops.find((s) => s.id === id)) {
                marker.remove();
                this.markers.delete(id);
            }
        }

        stops.forEach((stop, index) => {
            this.markers.get(stop.id)?.remove();

            const content = this.buildMarkerContent(index + 1, stop.name);
            const marker = new maplibregl.Marker({ element: content, draggable: true, anchor: "bottom" })
                .setLngLat([stop.longitude, stop.latitude])
                .addTo(this.map);

            marker.on("dragend", () => {
                const lngLat = marker.getLngLat();
                const finalPos = stop.snapToRoute ? this.snapToPath(lngLat.lat, lngLat.lng) : { lat: lngLat.lat, lng: lngLat.lng };
                marker.setLngLat([finalPos.lng, finalPos.lat]);
                useTripStore.getState().updateStopPosition(stop.id, finalPos.lat, finalPos.lng);
            });

            this.markers.set(stop.id, marker);
        });
    }

    private buildMarkerContent(index: number, name: string): HTMLElement {
        const wrapper = document.createElement("div");
        // No `position` here — this div is maplibregl.Marker's own root element, and it needs
        // `.maplibregl-marker`'s class-based `position:absolute` (added by the Marker constructor)
        // to stay in effect for the transform-based zoom/pan tracking to work. An inline
        // `position: relative` would win the cascade and desync the pin from its true anchor as
        // soon as the map moves. `position:absolute` still establishes a containing block for the
        // tooltip/caret children below, so their `position:absolute` anchoring is unaffected.
        wrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; cursor: grab;";

        const tooltip = document.createElement("div");
        tooltip.textContent = name || `Stop ${index}`;
        tooltip.style.cssText = `
            position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.75); color: white; font-size: 11px; font-weight: 500;
            padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none;
            opacity: 0; transition: opacity 0.15s ease;
        `;
        const caret = document.createElement("div");
        caret.style.cssText = `
            position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
            border: 4px solid transparent; border-top-color: rgba(0,0,0,0.75);
            pointer-events: none; opacity: 0; transition: opacity 0.15s ease;
        `;

        const pin = document.createElement("div");
        pin.style.cssText = `
            width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
            background: #2563eb; border: 2px solid #1d4ed8; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `;
        const label = document.createElement("span");
        label.textContent = String(index);
        label.style.cssText = "transform: rotate(45deg); color: #fff; font-weight: 700; font-size: 12px;";
        pin.appendChild(label);

        wrapper.appendChild(tooltip);
        wrapper.appendChild(caret);
        wrapper.appendChild(pin);

        wrapper.addEventListener("mouseover", () => {
            tooltip.style.opacity = "1";
            caret.style.opacity = "1";
        });
        wrapper.addEventListener("mouseout", () => {
            tooltip.style.opacity = "0";
            caret.style.opacity = "0";
        });

        return wrapper;
    }

    clearPendingMarker() {
        this.pendingMarker?.remove();
        this.pendingMarker = null;
    }

    clearAll() {
        this.disablePlacementMode();
        this.clearPendingMarker();
        for (const [, marker] of this.markers) marker.remove();
        this.markers.clear();
        this.clearTripStopMarkers();
    }

    // ─── Read-only trip stops (dashboard — shown while a trip is active) ──────
    syncTripStopMarkers(stops: Stop[]) {
        // Ordered by sequence — the backend has no ORDER BY, so array order isn't guaranteed.
        const ordered = [...stops].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

        for (const [id, marker] of this.tripStopMarkers) {
            if (!ordered.find((s) => s.id === id)) {
                marker.remove();
                this.tripStopMarkers.delete(id);
            }
        }

        ordered.forEach((stop, index) => {
            if (this.tripStopMarkers.has(stop.id)) return; // fixed trip — position never changes mid-trip

            const label = `S${index + 1}`;
            const marker = new maplibregl.Marker({ element: this.buildTripStopContent(label) })
                .setLngLat([stop.longitude, stop.latitude])
                .addTo(this.map);

            this.tripStopMarkers.set(stop.id, marker);
        });
    }

    clearTripStopMarkers() {
        for (const [, marker] of this.tripStopMarkers) marker.remove();
        this.tripStopMarkers.clear();
    }

    private buildTripStopContent(label: string): HTMLElement {
        const el = document.createElement("div");
        const fontSize = label.length >= 4 ? 9 : label.length === 3 ? 10.5 : 12;

        el.style.cssText = `
            box-sizing: border-box; width: 28px; height: 28px; border-radius: 50%;
            background: #dc2626; border: 2px solid #7f1d1d; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center; color: #fff;
            font-size: ${fontSize}px; font-weight: 700; font-family: system-ui, sans-serif;
            line-height: 1; white-space: nowrap; overflow: hidden;
        `;
        el.textContent = label;
        return el;
    }
}
