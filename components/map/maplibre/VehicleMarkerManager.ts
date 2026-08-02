import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import { VehicleLocation } from "@/lib/types";
import { markerStatusColor } from "@/mock-data/locations";
import { useMapsStore } from "@/store/maps-store";
import { formatTime } from "@/lib/utils";

type VehicleProps = { vehicleNo: string };

type MarkerState = {
    marker: maplibregl.Marker;
    root: HTMLElement;
    icon: HTMLElement | null;
    speedEl: HTMLElement | null;
    signalEl: HTMLElement | null;
    satelliteEl: HTMLElement | null;
    timeEl: HTMLElement | null;
    animationFrameId: number | null;
};

/** MapLibre port of components/map/VehicleMarkerManager.ts — same public API, same marker HTML/behavior. */
export class VehicleMarkerManager {
    private map: maplibregl.Map;
    private markers = new Map<string, MarkerState>();
    private clusterMarkers = new Map<string, maplibregl.Marker>();
    private index = new Supercluster<VehicleProps>({ radius: 80, maxZoom: 15 });
    private vehiclesByNo = new Map<string, VehicleLocation>();
    private onMoveEnd: () => void;

    constructor(map: maplibregl.Map) {
        this.map = map;
        // Supercluster's k-d trees don't exist until load() runs — seed with an empty set so a
        // moveend/zoomend firing before the first updateVehicles() (e.g. another manager's fitBounds
        // on init) hits valid empty trees instead of crashing on getClusters().
        this.index.load([]);
        this.onMoveEnd = () => this.renderClusters();
        this.map.on("moveend", this.onMoveEnd);
        this.map.on("zoomend", this.onMoveEnd);
    }

    updateVehicles(vehicles: VehicleLocation[]) {
        this.vehiclesByNo = new Map(vehicles.map((v) => [v.vehicleNo, v]));

        const points: Supercluster.PointFeature<VehicleProps>[] = vehicles.map((v) => ({
            type: "Feature",
            properties: { vehicleNo: v.vehicleNo },
            geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
        }));
        this.index.load(points);

        this.renderClusters();
    }

    private renderClusters() {
        const bounds = this.map.getBounds();
        const bbox: [number, number, number, number] = [
            bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(),
        ];
        const zoom = Math.round(this.map.getZoom());
        const clusters = this.index.getClusters(bbox, zoom);

        const seenVehicles = new Set<string>();
        const seenClusters = new Set<string>();

        for (const feature of clusters) {
            const [lng, lat] = feature.geometry.coordinates;

            if ("cluster" in feature.properties && feature.properties.cluster) {
                const clusterId = String(feature.properties.cluster_id);
                seenClusters.add(clusterId);
                this.upsertClusterMarker(clusterId, lng, lat, feature.properties.point_count, feature.properties.cluster_id);
                continue;
            }

            const vehicleNo = (feature.properties as VehicleProps).vehicleNo;
            const vehicle = this.vehiclesByNo.get(vehicleNo);
            if (!vehicle) continue;
            seenVehicles.add(vehicleNo);

            const existing = this.markers.get(vehicleNo);
            if (!existing) {
                this.markers.set(vehicleNo, this.createMarker(vehicle));
            } else {
                this.animateMarker(existing, vehicle.latitude, vehicle.longitude);
                this.updateMarker(existing, vehicle);
            }
        }

        for (const [vehicleNo, state] of this.markers) {
            if (!seenVehicles.has(vehicleNo)) this.removeMarker(vehicleNo, state);
        }
        for (const [clusterId, marker] of this.clusterMarkers) {
            if (!seenClusters.has(clusterId)) {
                marker.remove();
                this.clusterMarkers.delete(clusterId);
            }
        }
    }

    private upsertClusterMarker(clusterId: string, lng: number, lat: number, count: number, superclusterId: number) {
        const existing = this.clusterMarkers.get(clusterId);
        if (existing) {
            existing.setLngLat([lng, lat]);
            return;
        }

        const size = Math.min(56, 32 + count);
        const el = document.createElement("div");
        el.style.cssText = `
            width:${size}px;height:${size}px;border-radius:9999px;cursor:pointer;
            background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;
            font-weight:600;font-size:13px;box-shadow:0 4px 10px rgba(0,0,0,0.25);border:2px solid white;
        `;
        el.textContent = String(count);
        el.addEventListener("click", () => {
            const expansionZoom = Math.min(this.index.getClusterExpansionZoom(superclusterId), 20);
            this.map.easeTo({ center: [lng, lat], zoom: expansionZoom });
        });

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(this.map);
        this.clusterMarkers.set(clusterId, marker);
    }

    private createMarker(vehicle: VehicleLocation): MarkerState {
        const root = document.createElement("div");
        root.style.willChange = "transform";
        root.style.pointerEvents = "auto";
        root.innerHTML = `
        <div class="vehicle-marker" style="position:relative;display:flex;flex-direction:column;align-items:center">

          <div class="vehicle-label">
            ${vehicle.vehicleNo.slice(-4)}
          </div>

          <div class="vehicle-tooltip" style="
            position:absolute;
            bottom:36px;
            left:50%;
            transform:translateX(-50%);
            background:white;
            border-radius:10px;
            border:1px solid #e5e7eb;
            box-shadow:0 6px 16px rgba(0,0,0,0.15);
            padding:10px 12px;
            font-size:12px;
            min-width:220px;
            display:none;
            font-family:system-ui;
          ">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-weight:600;font-size:13px;">${vehicle.vehicleNo}</span>
              <span style="font-size:10px;background:#f3f4f6;padding:2px 6px;border-radius:6px;">${vehicle.status}</span>
            </div>

            <div style="font-size:12px;color:#374151;line-height:1.4">
              <div>Speed: <span class="speed">${vehicle.speed ?? 0}</span> km/h</div>
              <div>Ignition: ${vehicle.ignition ? "ON" : "OFF"}</div>
              <div>Signal: <span class="signal">${vehicle.signalStrength ?? 0}</span>%</div>
              <div>Satellites: <span class="sat">${vehicle.noOfSatellites ?? 0}</span></div>
              <div style="margin-top:4px;font-size:11px;color:#6b7280">
                <div class="time">${vehicle.date} ${formatTime(vehicle.time)}</div>
              </div>
            </div>

          </div>

          <div class="vehicle-marker" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div class="vehicle-icon"></div>
          </div>

        </div>
      `;

        const icon = root.querySelector<HTMLElement>(".vehicle-icon");
        const markerEl = root.querySelector(".vehicle-marker") as HTMLElement;
        const tooltip = root.querySelector(".vehicle-tooltip") as HTMLElement;

        markerEl.addEventListener("mouseenter", () => { tooltip.style.display = "block"; });
        markerEl.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });

        const marker = new maplibregl.Marker({ element: root, anchor: "bottom" })
            .setLngLat([vehicle.longitude, vehicle.latitude])
            .addTo(this.map);

        const speedEl = root.querySelector<HTMLElement>(".speed");
        const signalEl = root.querySelector<HTMLElement>(".signal");
        const satelliteEl = root.querySelector<HTMLElement>(".sat");
        const timeEl = root.querySelector<HTMLElement>(".time");

        const state: MarkerState = { marker, root, icon, speedEl, signalEl, satelliteEl, timeEl, animationFrameId: null };
        this.updateMarker(state, vehicle);
        return state;
    }

    private animateMarker(state: MarkerState, toLat: number, toLng: number, duration = 7000) {
        if (state.animationFrameId !== null) {
            cancelAnimationFrame(state.animationFrameId);
            state.animationFrameId = null;
        }

        const from = state.marker.getLngLat();
        const startLat = from.lat;
        const startLng = from.lng;
        const start = performance.now();

        const animate = (time: number) => {
            const progress = Math.min((time - start) / duration, 1);
            const ease = progress * (2 - progress);
            const lat = startLat + (toLat - startLat) * ease;
            const lng = startLng + (toLng - startLng) * ease;
            state.marker.setLngLat([lng, lat]);

            if (progress < 1) {
                state.animationFrameId = requestAnimationFrame(animate);
            } else {
                state.animationFrameId = null;
            }
        };

        state.animationFrameId = requestAnimationFrame(animate);
    }

    private updateMarker(state: MarkerState, vehicle: VehicleLocation) {
        if (state.speedEl) state.speedEl.textContent = String(vehicle.speed ?? 0);
        if (state.signalEl) state.signalEl.textContent = String(vehicle.signalStrength ?? 0);
        if (state.satelliteEl) state.satelliteEl.textContent = String(vehicle.noOfSatellites ?? 0);
        if (state.timeEl) state.timeEl.textContent = `${vehicle.date} ${formatTime(vehicle.time)}`;

        const selectedId = useMapsStore.getState().selectedLocationId;
        if (vehicle.vehicleNo === selectedId) {
            state.root.classList.add("vehicle-selected");
            state.root.style.zIndex = "9999";
            if (state.icon) state.icon.style.background = "#2563eb";
        } else {
            state.root.classList.remove("vehicle-selected");
            state.root.style.zIndex = "1";
            if (state.icon) state.icon.style.background = markerStatusColor[vehicle.status] ?? "#6b7280";
        }
    }

    private removeMarker(vehicleNo: string, state: MarkerState) {
        if (state.animationFrameId !== null) cancelAnimationFrame(state.animationFrameId);
        state.marker.remove();
        this.markers.delete(vehicleNo);
    }

    /** Removes every marker (and cluster bubble) from the map — call on unmount. */
    clear() {
        for (const [vehicleNo, state] of this.markers) this.removeMarker(vehicleNo, state);
        for (const [, marker] of this.clusterMarkers) marker.remove();
        this.clusterMarkers.clear();
        this.map.off("moveend", this.onMoveEnd);
        this.map.off("zoomend", this.onMoveEnd);
    }
}
