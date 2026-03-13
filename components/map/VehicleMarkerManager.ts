import { VehicleLocation } from "@/lib/types";
import { markerStatusColor } from "@/mock-data/locations";
import { useMapsStore } from "@/store/maps-store";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";

type MarkerState = {
  marker: google.maps.marker.AdvancedMarkerElement;
  root: HTMLElement;

  icon: SVGElement | null;

  speedEl: HTMLElement | null;
  signalEl: HTMLElement | null;
  satelliteEl: HTMLElement | null;
  timeEl: HTMLElement | null;

  lastUpdate: number;
};

export class VehicleMarkerManager {
  private map: google.maps.Map;
  private markers = new Map<string, MarkerState>();
  private clusterer: MarkerClusterer;

  constructor(map: google.maps.Map) {
    this.map = map;

    this.clusterer = new MarkerClusterer({
      map: this.map,
      markers: [],
      algorithm: new SuperClusterAlgorithm({
        radius: 80,
        maxZoom: 15,
      }),
      onClusterClick: (_, cluster, map) => {
        if (!cluster.bounds) return;
        map.fitBounds(cluster.bounds);
      },
    });
  }

  // -------------------------------
  // create marker
  // -------------------------------

  private createMarker(vehicle: VehicleLocation): MarkerState {
    const root = document.createElement("div");

    root.style.willChange = "transform";
    root.style.transform = "translateZ(0)";
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

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:6px;
        ">
          <span style="font-weight:600;font-size:13px;">
            ${vehicle.vehicleNo}
          </span>

          <span style="
            font-size:10px;
            background:#f3f4f6;
            padding:2px 6px;
            border-radius:6px;
          ">
            ${vehicle.status}
          </span>
        </div>

        <div style="font-size:12px;color:#374151;line-height:1.4">

          <div>Speed: <span class="speed">${vehicle.speed ?? 0}</span> km/h</div>

          <div>Ignition: ${vehicle.ignition ? "ON" : "OFF"}</div>

          <div>Signal: <span class="signal">${vehicle.signalStrength ?? 0}</span>%</div>

          <div>Satellites: <span class="sat">${vehicle.noOfSatellites ?? 0}</span></div>

          <div style="margin-top:4px;font-size:11px;color:#6b7280">
            <div class="time">${vehicle.date} ${vehicle.time}</div>
          </div>

        </div>

      </div>

      <div class="vehicle-marker" style="
        width:28px;
        height:28px;
        display:flex;
        align-items:center;
        justify-content:center;
        transform: rotate(0deg);
      ">
        <div class="vehicle-icon"></div>
      </div>

    </div>
  `;

    const icon = root.querySelector<SVGElement>(".vehicle-icon");
    const markerEl = root.querySelector(".vehicle-marker") as HTMLElement;
    const tooltip = root.querySelector(".vehicle-tooltip") as HTMLElement;

    markerEl.addEventListener("mouseenter", () => {
      tooltip.style.display = "block";
    });

    markerEl.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: vehicle.latitude,
        lng: vehicle.longitude,
      },
      content: root,
    });

    this.clusterer.addMarker(marker);

    const speedEl = root.querySelector<HTMLElement>(".speed");
    const signalEl = root.querySelector<HTMLElement>(".signal");
    const satelliteEl = root.querySelector<HTMLElement>(".sat");
    const timeEl = root.querySelector<HTMLElement>(".time");

    return {
      marker,
      root,
      icon,
      speedEl,
      signalEl,
      satelliteEl,
      timeEl,
      lastUpdate: Date.now(),
    };
  }

  // -------------------------------
  // smooth animation
  // -------------------------------

  private animateMarker(
    marker: google.maps.marker.AdvancedMarkerElement,
    toLat: number,
    toLng: number,
    duration = 7000,
  ) {
    const from = marker.position as google.maps.LatLngLiteral;

    if (!from) {
      marker.position = { lat: toLat, lng: toLng };
      return;
    }

    const startLat = from.lat;
    const startLng = from.lng;

    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const ease = progress * (2 - progress);

      const lat = startLat + (toLat - startLat) * ease;
      const lng = startLng + (toLng - startLng) * ease;

      marker.position = { lat, lng };

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // -------------------------------
  // update vehicles
  // -------------------------------

  updateVehicles(vehicles: VehicleLocation[]) {
    vehicles.forEach((vehicle) => {
      const existing = this.markers.get(vehicle.vehicleNo);

      if (!existing) {
        const state = this.createMarker(vehicle);
        this.markers.set(vehicle.vehicleNo, state);
        return;
      }

      // const distance = Math.sqrt(
      //   Math.pow(vehicle.latitude - prevLat, 2) +
      //     Math.pow(vehicle.longitude - prevLng, 2),
      // );
      // const duration = Math.min(Math.max(distance * 50000, 800), 6000);

      this.animateMarker(existing.marker, vehicle.latitude, vehicle.longitude);
      this.updateMarker(existing, vehicle);
      existing.lastUpdate = Date.now();
    });
  }

  private updateMarker(state: MarkerState, vehicle: VehicleLocation) {
    if (state.speedEl) {
      state.speedEl.textContent = String(vehicle.speed ?? 0);
    }

    if (state.signalEl) {
      state.signalEl.textContent = String(vehicle.signalStrength ?? 0);
    }

    if (state.satelliteEl) {
      state.satelliteEl.textContent = String(vehicle.noOfSatellites ?? 0);
    }

    if (state.timeEl) {
      state.timeEl.textContent = `${vehicle.date} ${vehicle.time}`;
    }

    // 🔵 highlight selected vehicle
    const selectedId = useMapsStore.getState().selectedLocationId;

    if (vehicle.vehicleNo === selectedId) {
      state.root.classList.add("vehicle-selected");
      state.marker.zIndex = 9999;

      if (state.icon) {
        state.icon.style.fill = "#2563eb"; // selected color
      }
    } else {
      state.root.classList.remove("vehicle-selected");
      state.marker.zIndex = 1;

      if (state.icon) {
        state.icon.style.background =
          markerStatusColor[vehicle.status] ?? "#6b7280";
      }
    }

    state.lastUpdate = Date.now();
  }

  // -------------------------------
  // predictive movement (optional)
  // -------------------------------

  predictPosition(vehicle: VehicleLocation, seconds: number) {
    const R = 6378137;

    const distance = (vehicle.speed * seconds) / 3.6;

    // const headingRad = ((vehicle.heading ?? 0) * Math.PI) / 180;
    const headingRad = (0 * Math.PI) / 180;

    const lat =
      vehicle.latitude +
      ((distance * Math.cos(headingRad)) / R) * (180 / Math.PI);

    const lng =
      vehicle.longitude +
      ((distance * Math.sin(headingRad)) /
        (R * Math.cos((vehicle.latitude * Math.PI) / 180))) *
        (180 / Math.PI);

    return { lat, lng };
  }
}
