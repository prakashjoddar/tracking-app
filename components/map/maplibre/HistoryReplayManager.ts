import maplibregl from "maplibre-gl";
import { VehicleHistoryPoint } from "@/lib/types";

/** MapLibre port of components/map/HistoryReplayManager.tsx — same public API. */
export class HistoryReplayManager {
    private map: maplibregl.Map;
    private marker: maplibregl.Marker | null = null;
    private sourceId = "history-route-source";
    private layerId = "history-route-layer";

    constructor(map: maplibregl.Map) {
        this.map = map;
        this.ensureSource();
    }

    private ensureSource() {
        const setup = () => {
            if (this.map.getSource(this.sourceId)) return;
            this.map.addSource(this.sourceId, {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });
            this.map.addLayer({
                id: this.layerId, type: "line", source: this.sourceId,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#ff6600", "line-width": 4 },
            });
        };
        if (this.map.isStyleLoaded()) setup();
        else this.map.once("load", setup);
    }

    private setLineData(path: [number, number][]) {
        this.ensureSource();
        const source = this.map.getSource(this.sourceId) as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: path } });
    }

    private ensureMarker(): maplibregl.Marker {
        if (!this.marker) {
            const el = document.createElement("img");
            el.src = "/assets/location.png";
            el.style.width = "40px";
            el.style.height = "40px";
            this.marker = new maplibregl.Marker({ element: el });
        }
        return this.marker;
    }

    loadRoute(points: VehicleHistoryPoint[]) {
        const path: [number, number][] = points.map((p) => [p.longitude, p.latitude]);
        this.setLineData(path);

        if (path.length > 0) {
            this.ensureMarker().setLngLat(path[0]).addTo(this.map);

            const lngs = path.map((p) => p[0]);
            const lats = path.map((p) => p[1]);
            this.map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 60 },
            );
        }
    }

    moveTo(point: VehicleHistoryPoint) {
        if (!this.marker) return;
        const pos: [number, number] = [point.longitude, point.latitude];
        this.marker.setLngLat(pos);
        this.map.panTo(pos);
    }

    clear() {
        this.setLineData([]);
        this.marker?.remove();
        this.marker = null;
    }
}
