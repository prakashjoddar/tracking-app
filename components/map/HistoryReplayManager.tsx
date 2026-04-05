import { VehicleHistoryPoint } from "@/lib/types";
import { FaMapMarkerAlt } from "react-icons/fa";

export class HistoryReplayManager {

    private map: google.maps.Map
    private marker: google.maps.Marker | null = null
    private polyline: google.maps.Polyline | null = null

    constructor(map: google.maps.Map) {
        this.map = map
    }

    // loadRoute(points: VehicleHistoryPoint[]) {

    //     const path = points.map(p => ({
    //         lat: p.latitude,
    //         lng: p.longitude
    //     }))

    //     if (this.polyline) {
    //         this.polyline.setMap(null)
    //     }

    //     this.polyline = new google.maps.Polyline({
    //         path,
    //         strokeColor: "#ff6600",
    //         strokeWeight: 4,
    //         map: this.map
    //     })

    //     if (!this.marker) {
    //         this.marker = new google.maps.Marker({
    //             map: this.map
    //         })
    //     }

    //     if (path.length > 0) {
    //         this.marker.setPosition(path[0])
    //     }
    // }

    loadRoute(points: VehicleHistoryPoint[]) {

        const path = points.map(p => ({
            lat: p.latitude,
            lng: p.longitude
        }))

        if (!this.polyline) {
            this.polyline = new google.maps.Polyline({
                strokeColor: "#ff6600",
                strokeWeight: 4,
                map: this.map
            })
        }

        this.polyline.setPath(path)

        if (!this.marker) {
            this.marker = new google.maps.Marker({
                map: this.map,
                icon: {
                    url: '/assets/location.png',
                    scaledSize: new google.maps.Size(40, 40)
                }
            })
        }

        if (path.length > 0) {

            // reset marker position
            this.marker.setPosition(path[0])

            // fit route in view
            const bounds = new google.maps.LatLngBounds()

            path.forEach(p => bounds.extend(p))

            this.map.fitBounds(bounds)
        }
    }

    moveTo(point: VehicleHistoryPoint) {
        if (!this.marker) return

        const pos = {
            lat: point.latitude,
            lng: point.longitude
        }

        this.marker.setPosition(pos)

        this.map.panTo(pos)
    }

    clear() {
        if (this.polyline) {
            this.polyline.setMap(null)
            this.polyline = null
        }
        if (this.marker) {
            this.marker.setMap(null)
            this.marker = null
        }
    }
}