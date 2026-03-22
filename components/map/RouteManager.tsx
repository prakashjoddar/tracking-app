export class RouteManager {

    private map: google.maps.Map
    private polyline: google.maps.Polyline | null = null

    private startMarker: google.maps.marker.AdvancedMarkerElement | null = null
    private endMarker: google.maps.marker.AdvancedMarkerElement | null = null

    private fullPath: google.maps.LatLng[] = []   // 👈 store full decoded path


    constructor(map: google.maps.Map) {
        this.map = map
    }

    drawEncodedRoute(encoded: string) {
        const path = google.maps.geometry.encoding.decodePath(encoded)

        if (path.length === 0) {
            console.warn("decodePath returned empty — check your encoded string")
            return
        }

        // ─── Start marker ───────────────────────────────────────────
        const startPin = new google.maps.marker.PinElement({
            background: "#16a34a",
            borderColor: "#14532d",
            glyph: "S",
            glyphColor: "#fff",
        })
        new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: path[0],
            content: startPin.element,
            title: "Start",
        })

        // ─── End marker ─────────────────────────────────────────────
        const endPin = new google.maps.marker.PinElement({
            background: "#dc2626",
            borderColor: "#7f1d1d",
            glyph: "E",
            glyphColor: "#fff",
        })
        new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: path[path.length - 1],
            content: endPin.element,
            title: "End",
        })

        // ─── Polyline ────────────────────────────────────────────────
        if (!this.polyline) {
            this.polyline = new google.maps.Polyline({
                strokeColor: "#2563eb",
                strokeWeight: 4,
                map: this.map,
            })
        }

        this.polyline.setPath(path)

        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        this.map.fitBounds(bounds)
    }

    clearRoute() {
        if (this.polyline) {
            this.polyline.setMap(null)
            this.polyline = null
        }
        if (this.startMarker) {
            this.startMarker.map = null
            this.startMarker = null
        }
        if (this.endMarker) {
            this.endMarker.map = null
            this.endMarker = null
        }
    }

    // 0.0 → 1.0 progress value
    drawPartialRoute(progress: number): void {
        if (this.fullPath.length === 0) return

        const clampedProgress = Math.max(0, Math.min(1, progress))
        const endIndex = Math.ceil(this.fullPath.length * clampedProgress)
        const partial = this.fullPath.slice(0, Math.max(endIndex, 1))

        this.renderPath(partial, false)  // false = don't refit bounds
    }

    private renderPath(path: google.maps.LatLng[], fitBounds: boolean = true): void {

        // start marker
        if (!this.startMarker) {
            const startPin = new google.maps.marker.PinElement({
                background: "#16a34a",
                borderColor: "#14532d",
                glyph: "S",
                glyphColor: "#fff",
            })
            this.startMarker = new google.maps.marker.AdvancedMarkerElement({
                map: this.map,
                position: this.fullPath[0],   // always full path start
                content: startPin.element,
                title: "Start",
            })
        }

        // end marker follows progress
        const endPin = new google.maps.marker.PinElement({
            background: "#dc2626",
            borderColor: "#7f1d1d",
            glyph: "E",
            glyphColor: "#fff",
        })
        if (this.endMarker) {
            this.endMarker.map = null
        }
        this.endMarker = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: path[path.length - 1],  // follows progress
            content: endPin.element,
            title: "End",
        })

        // polyline
        if (!this.polyline) {
            this.polyline = new google.maps.Polyline({
                strokeColor: "#2563eb",
                strokeWeight: 4,
                map: this.map,
            })
        }
        this.polyline.setPath(path)

        if (fitBounds) {
            const bounds = new google.maps.LatLngBounds()
            path.forEach(p => bounds.extend(p))
            this.map.fitBounds(bounds)
        }
    }
}