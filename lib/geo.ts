/** Great-circle distance in meters between two lat/lng points. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
}

function closestPointOnSegment(
    p: [number, number], a: [number, number], b: [number, number],
): [number, number] {
    const [px, py] = p
    const [ax, ay] = a
    const [bx, by] = b
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return a
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    return [ax + t * dx, ay + t * dy]
}

/** Nearest distance (meters) from a [lng, lat] point to a [lng, lat][] path — plain-haversine
 * port of google.maps.geometry.spherical's point-to-polyline snapping, so route-deviation math
 * works identically under the MapLibre engine, which has no google.maps dependency to lean on. */
export function nearestDistanceMeters(point: [number, number], path: [number, number][]): number {
    if (path.length === 0) return Infinity
    if (path.length === 1) return haversineMeters(point[1], point[0], path[0][1], path[0][0])
    let minDist = Infinity
    for (let i = 0; i < path.length - 1; i++) {
        const snapped = closestPointOnSegment(point, path[i], path[i + 1])
        const dist = haversineMeters(point[1], point[0], snapped[1], snapped[0])
        if (dist < minDist) minDist = dist
    }
    return minDist
}
