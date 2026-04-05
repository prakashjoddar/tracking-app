import { Geofence } from "@/lib/types"
import { useGeofenceStore } from "@/store/geofence-store"

export class GeofenceMarkerManager {
    private map: google.maps.Map
    private circles: Map<string, google.maps.Circle> = new Map()
    private markers: Map<string, google.maps.marker.AdvancedMarkerElement> = new Map()
    private clickListener: google.maps.MapsEventListener | null = null
    private pendingMarker: google.maps.marker.AdvancedMarkerElement | null = null
    private pendingCircle: google.maps.Circle | null = null
    private infoWindow: google.maps.InfoWindow = new google.maps.InfoWindow({ disableAutoPan: true })

    constructor(map: google.maps.Map) {
        this.map = map
    }

    // ─── Placement Mode (Click to select location) ───────────────────────────
    enablePlacementMode(onPlace: (lat: number, lng: number) => void) {
        this.disablePlacementMode()
        this.map.setOptions({ draggableCursor: "crosshair" })

        this.clickListener = this.map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return
            onPlace(e.latLng.lat(), e.latLng.lng())
        })
    }

    disablePlacementMode() {
        if (this.clickListener) {
            google.maps.event.removeListener(this.clickListener)
            this.clickListener = null
        }
        this.map.setOptions({ draggableCursor: undefined })
    }

    // ─── Pending Location Preview ───────────────────────────────────────────
    // updatePendingLocation(lat: number, lng: number, radius: number = 150, color: string = "#fb923c") {
    //     const position = { lat, lng }

    //     // Update or Create Marker
    //     if (!this.pendingMarker) {
    //         const pin = new google.maps.marker.PinElement({
    //             background: "#fb923c",
    //             borderColor: "#9a3412",
    //             glyphColor: "#fff",
    //         })
    //         this.pendingMarker = new google.maps.marker.AdvancedMarkerElement({
    //             map: this.map,
    //             position,
    //             content: pin.element,
    //         })
    //     } else {
    //         this.pendingMarker.position = position
    //     }

    //     // Update or Create Circle
    //     const circleOptions: google.maps.CircleOptions = {
    //         map: this.map,
    //         center: position,
    //         radius: radius,
    //         fillColor: color,
    //         fillOpacity: 0.15,
    //         strokeColor: color,
    //         strokeOpacity: 0.8,
    //         strokeWeight: 2,
    //         clickable: false
    //     }

    //     if (!this.pendingCircle) {
    //         this.pendingCircle = new google.maps.Circle(circleOptions)
    //     } else {
    //         this.pendingCircle.setOptions(circleOptions)
    //     }
    // }

    clearPending() {
        if (this.pendingMarker) {
            this.pendingMarker.map = null
            this.pendingMarker = null
        }
        if (this.pendingCircle) {
            this.pendingCircle.setMap(null)
            this.pendingCircle = null
        }
    }

    // ─── Sync Geofences to Map ────────────────────────────────────────────────
    // syncGeofences(geofences: Geofence[]) {
    //     // Remove circles that are no longer in the list
    //     for (const [id, circle] of this.circles) {
    //         if (!geofences.find(g => g.id === id)) {
    //             circle.setMap(null)
    //             this.circles.delete(id)
    //         }
    //     }

    //     // Add or update circles
    //     geofences.forEach(gf => {
    //         if (!gf.id) return

    //         const existing = this.circles.get(gf.id)
    //         const options: google.maps.CircleOptions = {
    //             map: this.map,
    //             center: { lat: gf.latitude, lng: gf.longitude },
    //             radius: gf.radius,
    //             fillColor: gf.color || "#3b82f6",
    //             fillOpacity: 0.2,
    //             strokeColor: gf.color || "#3b82f6",
    //             strokeOpacity: 0.8,
    //             strokeWeight: 2,
    //             clickable: true,
    //             editable: false,
    //             visible: gf.enable
    //         }

    //         if (existing) {
    //             existing.setOptions(options)
    //         } else {
    //             const circle = new google.maps.Circle(options)

    //             // Add click listener to select the geofence
    //             circle.addListener("click", () => {
    //                useGeofenceStore.getState().setEditingGeofence(gf.id!)
    //             })

    //             this.circles.set(gf.id, circle)
    //         }
    //     })
    // }

    clearAll() {
        this.disablePlacementMode()
        this.infoWindow.close()
        for (const circle of this.circles.values()) circle.setMap(null)
        this.circles.clear()
        for (const marker of this.markers.values()) marker.map = null
        this.markers.clear()
    }

    // ─── Zoom map to a single geofence so its circle is visible ─────────────
    zoomToGeofence(lat: number, lng: number, radius: number): void {
        const padded = new google.maps.Circle({
            center: { lat, lng },
            radius: Math.max(radius * 4, 800), // enough padding to see the circle clearly
        })
        this.map.fitBounds(padded.getBounds()!, { top: 80, bottom: 80, left: 80, right: 80 })
        padded.setMap(null)
    }

    // ─── Pending Location Preview ───────────────────────────────────────────
    updatePendingLocation(lat: number, lng: number, radius: number = 150, color: string = "#3b82f6") {
        const position = { lat, lng }

        // Zoom in if map is too far out to see the circle
        const currentZoom = this.map.getZoom() ?? 0
        if (currentZoom < 13) {
            this.zoomToGeofence(lat, lng, radius)
        }

        // ✅ Use actual selected color for pin, not hardcoded orange
        if (!this.pendingMarker) {
            const pin = new google.maps.marker.PinElement({
                background: color,
                borderColor: color,
                glyphColor: "#fff",
            })
            this.pendingMarker = new google.maps.marker.AdvancedMarkerElement({
                map: this.map,
                position,
                content: pin.element,
            })
        } else {
            // Recreate pin with new color since PinElement color can't be updated in place
            const pin = new google.maps.marker.PinElement({
                background: color,
                borderColor: color,
                glyphColor: "#fff",
            })
            this.pendingMarker.content = pin.element
            this.pendingMarker.position = position
        }

        const circleOptions: google.maps.CircleOptions = {
            map: this.map,
            center: position,
            radius,
            fillColor: color,
            fillOpacity: 0.15,
            strokeColor: color,
            strokeOpacity: 0.9,
            strokeWeight: 2.5,
            clickable: false,
        }

        if (!this.pendingCircle) {
            this.pendingCircle = new google.maps.Circle(circleOptions)
        } else {
            this.pendingCircle.setOptions(circleOptions)
        }
    }

    // ─── Sync Geofences to Map ────────────────────────────────────────────────
    syncGeofences(geofences: Geofence[], editingId?: string | null) {
        // Remove stale circles and markers
        for (const [id, circle] of this.circles) {
            if (!geofences.find(g => g.id === id)) {
                circle.setMap(null)
                this.circles.delete(id)
                const m = this.markers.get(id)
                if (m) { m.map = null; this.markers.delete(id) }
            }
        }

        geofences.forEach(gf => {
            if (!gf.id) return

            const isEditing = gf.id === editingId
            const color = gf.color || "#3b82f6"
            const position = { lat: gf.latitude, lng: gf.longitude }

            // ── Circle ──────────────────────────────────────────────────────
            const circleOptions: google.maps.CircleOptions = {
                map: isEditing ? null : this.map,
                center: position,
                radius: gf.radius,
                fillColor: color,
                fillOpacity: gf.enable ? 0.2 : 0.05,
                strokeColor: color,
                strokeOpacity: gf.enable ? 0.85 : 0.3,
                strokeWeight: 2,
                clickable: !isEditing,
                editable: false,
            }

            const existingCircle = this.circles.get(gf.id)
            if (existingCircle) {
                existingCircle.setOptions(circleOptions)
            } else {
                const circle = new google.maps.Circle(circleOptions)
                circle.addListener("click", () => {
                    useGeofenceStore.getState().setEditingGeofence(gf.id!)
                })
                this.circles.set(gf.id, circle)
            }

            // ── Marker ──────────────────────────────────────────────────────
            const existingMarker = this.markers.get(gf.id)
            if (existingMarker) {
                existingMarker.map = isEditing ? null : this.map
                const pin = new google.maps.marker.PinElement({
                    background: color,
                    borderColor: color,
                    glyphColor: "#fff",
                })
                existingMarker.content = pin.element
                existingMarker.position = position
            } else {
                const pin = new google.maps.marker.PinElement({
                    background: color,
                    borderColor: color,
                    glyphColor: "#fff",
                })
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map: isEditing ? null : this.map,
                    position,
                    content: pin.element,
                })
                marker.addListener("click", () => {
                    useGeofenceStore.getState().setEditingGeofence(gf.id!)
                })
                marker.addListener("mouseover", () => {
                    this.infoWindow.setContent(
                        `<div style="font-size:12px;font-weight:600;padding:2px 2px">${gf.name}</div>`
                    )
                    this.infoWindow.open({ map: this.map, anchor: marker })
                })
                marker.addListener("mouseout", () => this.infoWindow.close())
                this.markers.set(gf.id, marker)
            }
        })
    }

    // ─── Fit map to show all geofences ────────────────────────────────────────
    fitToGeofences(geofences: Geofence[]): void {
        if (geofences.length === 0) return
        const bounds = new google.maps.LatLngBounds()
        geofences.forEach(gf => {
            // extend bounds by the circle edge, not just center
            const circle = new google.maps.Circle({
                center: { lat: gf.latitude, lng: gf.longitude },
                radius: gf.radius,
            })
            bounds.union(circle.getBounds()!)
            circle.setMap(null)
        })
        this.map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
    }
}
