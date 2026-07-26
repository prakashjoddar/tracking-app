import polyline from "@mapbox/polyline";

/** Decodes the same encoded-polyline format the backend already produces, returned as [lng, lat] pairs (GeoJSON/MapLibre order). */
export function decodeEncodedPolyline(encoded: string): [number, number][] {
    return polyline.decode(encoded).map(([lat, lng]) => [lng, lat] as [number, number]);
}
