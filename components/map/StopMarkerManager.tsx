import { StopType } from "@/lib/types"
import { useTripStore } from "@/store/trip-store"

export class StopMarkerManager {

    private map: google.maps.Map
    private markers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map()
    private clickListener: google.maps.MapsEventListener | null = null
    private pendingMarker: google.maps.marker.AdvancedMarkerElement | null = null
    private decodedPath: google.maps.LatLng[] = []   // 👈 store decoded path

    constructor(map: google.maps.Map) {
        this.map = map
    }

    // 👇 Call this after drawEncodedRoute so markers know the path
    setPath(encoded: string) {
        this.decodedPath = google.maps.geometry.encoding.decodePath(encoded)
    }

    // ─── Snap to nearest point on polyline ───────────────────────────────────
    private snapToPath(latLng: google.maps.LatLng): google.maps.LatLng {
        if (this.decodedPath.length === 0) return latLng

        let closestPoint = this.decodedPath[0]
        let minDist = Infinity

        for (let i = 0; i < this.decodedPath.length - 1; i++) {
            const snapped = this.closestPointOnSegment(
                latLng,
                this.decodedPath[i],
                this.decodedPath[i + 1]
            )
            const dist = google.maps.geometry.spherical.computeDistanceBetween(latLng, snapped)
            if (dist < minDist) {
                minDist = dist
                closestPoint = snapped
            }
        }

        return closestPoint
    }

    // Project point P onto segment (A → B), return clamped point on segment
    private closestPointOnSegment(
        p: google.maps.LatLng,
        a: google.maps.LatLng,
        b: google.maps.LatLng
    ): google.maps.LatLng {
        const ax = a.lng(), ay = a.lat()
        const bx = b.lng(), by = b.lat()
        const px = p.lng(), py = p.lat()

        const dx = bx - ax
        const dy = by - ay
        const lenSq = dx * dx + dy * dy

        if (lenSq === 0) return a   // segment is a point

        // t = dot product of (P-A) and (B-A) / |B-A|²  → clamped to [0,1]
        let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
        t = Math.max(0, Math.min(1, t))

        return new google.maps.LatLng(
            ay + t * dy,
            ax + t * dx
        )
    }

    // ─── Placement mode ───────────────────────────────────────────────────────
    enablePlacementMode(onPlace: (lat: number, lng: number, snapToRoute: boolean) => void) {
        this.disablePlacementMode()
        this.map.setOptions({ draggableCursor: "crosshair" })

        this.clickListener = this.map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return

            const snapToRoute = useTripStore.getState().snapToRoute  // 👈 read from store
            const position = snapToRoute ? this.snapToPath(e.latLng) : e.latLng

            onPlace(position.lat(), position.lng(), snapToRoute)
        })
    }

    private toLatLng(pos: google.maps.LatLng | google.maps.LatLngLiteral | null): google.maps.LatLng | null {
        if (!pos) return null
        if (pos instanceof google.maps.LatLng) return pos
        // now TypeScript knows it's LatLngLiteral — has .lat and .lng as numbers
        return new google.maps.LatLng(pos.lat, pos.lng)
    }

    private placePendingMarker(
        position: google.maps.LatLng,
        onPlace: (lat: number, lng: number) => void
    ) {
        const pin = new google.maps.marker.PinElement({
            background: "#f59e0b",
            borderColor: "#b45309",
            glyphColor: "#fff",
        })

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position,
            content: pin.element,
            gmpDraggable: true,   // 👈 allow dragging
        })

        // Snap back to path on every drag end
        marker.addListener("dragend", () => {
            const latLng = this.toLatLng(marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null)
            if (!latLng) return

            const snapped = this.snapToPath(latLng)
            marker.position = snapped
            onPlace(snapped.lat(), snapped.lng())
        })


        this.pendingMarker = marker
        onPlace(position.lat(), position.lng())
    }

    disablePlacementMode() {
        if (this.clickListener) {
            google.maps.event.removeListener(this.clickListener)
            this.clickListener = null
        }
        this.map.setOptions({ draggableCursor: undefined })
    }

    // ─── Confirmed stop markers ───────────────────────────────────────────────
    syncStops(stops: {
        // id: string; latitude: number; longitude: number, name: string, snapToRoute: boolean
        id: string;
        name: string;
        enable: boolean;
        type: StopType;
        latitude: number;
        longitude: number;
        studentId: number[];
        tripId: string;
        snapToRoute?: boolean;
    }[]) {
        for (const [id, marker] of this.markers) {
            if (!stops.find(s => s.id === id)) {
                marker.map = null
                this.markers.delete(id)
            }
        }

        stops.forEach((stop, index) => {
            const existing = this.markers.get(stop.id)
            if (existing) {
                existing.map = null
                this.markers.delete(stop.id)
            }

            const content = this.buildMarkerContent(index + 1, stop.name)

            const pin = new google.maps.marker.PinElement({
                background: "#2563eb",
                borderColor: "#1d4ed8",
                glyph: String(index + 1),
                glyphColor: "#fff",
            })

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: this.map,
                position: { lat: stop.latitude, lng: stop.longitude },
                content: pin.element,
                gmpDraggable: true,   // 👈 confirmed stops also draggable
            })

            // Snap confirmed marker on drag too
            marker.addListener("dragend", () => {
                const latLng = this.toLatLng(marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null)
                if (!latLng) return

                const finalPosition = stop.snapToRoute ? this.snapToPath(latLng) : latLng  // 👈
                marker.position = finalPosition
                useTripStore.getState().updateStopPosition(stop.id, finalPosition.lat(), finalPosition.lng())
            })

            this.markers.set(stop.id, marker)
        })
    }

    // 👇 build marker with tooltip baked in
    private buildMarkerContent(index: number, name: string): HTMLElement {
        const wrapper = document.createElement("div")
        wrapper.style.cssText = "position: relative; display: flex; flex-direction: column; align-items: center;"

        // Tooltip
        const tooltip = document.createElement("div")
        tooltip.textContent = name || `Stop ${index}`
        tooltip.style.cssText = `
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: white;
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 6px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
    `
        // small caret
        const caret = document.createElement("div")
        caret.style.cssText = `
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: rgba(0,0,0,0.75);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
    `

        // Pin element
        const pin = new google.maps.marker.PinElement({
            background: "#2563eb",
            borderColor: "#1d4ed8",
            glyph: String(index),
            glyphColor: "#fff",
        })

        wrapper.appendChild(tooltip)
        wrapper.appendChild(caret)
        wrapper.appendChild(pin.element)

        // hover listeners on the wrapper
        wrapper.addEventListener("mouseover", () => {
            tooltip.style.opacity = "1"
            caret.style.opacity = "1"
        })
        wrapper.addEventListener("mouseout", () => {
            tooltip.style.opacity = "0"
            caret.style.opacity = "0"
        })

        return wrapper
    }

    clearPendingMarker() {
        if (this.pendingMarker) {
            this.pendingMarker.map = null
            this.pendingMarker = null
        }
    }

    clearAll() {
        this.disablePlacementMode()
        this.clearPendingMarker()
        for (const marker of this.markers.values()) marker.map = null
        this.markers.clear()
    }
}