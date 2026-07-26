import maplibregl from "maplibre-gl";
import { decodeEncodedPolyline } from "@/lib/polyline-decode";

/** MapLibre port of components/map/RouteManager.tsx — same public API. */
export class RouteManager {
    private map: maplibregl.Map;
    private sourceId = "route-line-source";
    private layerId = "route-line-layer";

    private startMarker: maplibregl.Marker | null = null;
    private endMarker: maplibregl.Marker | null = null;
    private fullPath: [number, number][] = [];

    constructor(map: maplibregl.Map) {
        this.map = map;
        this.ensureSource();
    }

    private ensureSource() {
        const addSource = () => {
            if (this.map.getSource(this.sourceId)) return;
            this.map.addSource(this.sourceId, {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });
            this.map.addLayer({
                id: this.layerId,
                type: "line",
                source: this.sourceId,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#2563eb", "line-width": 4 },
            });
        };
        if (this.map.isStyleLoaded()) addSource();
        else this.map.once("load", addSource);
    }

    private setLineData(path: [number, number][]) {
        this.ensureSource();
        const source = this.map.getSource(this.sourceId) as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } });
    }

    private createPin(background: string, borderColor: string, glyph: string): HTMLElement {
        const el = document.createElement("div");
        el.style.cssText = `
            width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            background:${background};border:2px solid ${borderColor};
            display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        `;
        const label = document.createElement("span");
        label.textContent = glyph;
        label.style.cssText = "transform:rotate(45deg);color:#fff;font-weight:700;font-size:12px;";
        el.appendChild(label);
        return el;
    }

    drawEncodedRoute(encoded: string) {
        const path = decodeEncodedPolyline(encoded);
        if (path.length === 0) {
            console.warn("decodeEncodedPolyline returned empty — check your encoded string");
            return;
        }

        this.fullPath = path;

        this.startMarker?.remove();
        this.startMarker = null;
        this.endMarker?.remove();
        this.endMarker = null;

        this.renderPath(path, true);
    }

    clearRoute() {
        this.setLineData([]);
        this.startMarker?.remove();
        this.startMarker = null;
        this.endMarker?.remove();
        this.endMarker = null;
        this.fullPath = [];
    }

    /** 0.0 → 1.0 progress value */
    drawPartialRoute(progress: number): void {
        if (this.fullPath.length === 0) return;

        const clampedProgress = Math.max(0, Math.min(1, progress));
        const endIndex = Math.ceil(this.fullPath.length * clampedProgress);
        const partial = this.fullPath.slice(0, Math.max(endIndex, 1));

        this.renderPath(partial, false);
    }

    private renderPath(path: [number, number][], fitBounds: boolean): void {
        if (!this.startMarker) {
            this.startMarker = new maplibregl.Marker({ element: this.createPin("#16a34a", "#14532d", "S") })
                .setLngLat(this.fullPath[0])
                .addTo(this.map);
        }

        this.endMarker?.remove();
        this.endMarker = new maplibregl.Marker({ element: this.createPin("#dc2626", "#7f1d1d", "E") })
            .setLngLat(path[path.length - 1])
            .addTo(this.map);

        this.setLineData(path);

        if (fitBounds) {
            const lngs = path.map((p) => p[0]);
            const lats = path.map((p) => p[1]);
            this.map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 60 },
            );
        }
    }
}
