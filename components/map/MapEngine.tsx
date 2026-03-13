"use client";

import { GoogleMapView } from "./GoogleMapView";

// import { MapLibreView } from "./MapLibreView";

type Props = {
    provider?: "google" | "maplibre";
};

export function MapEngine({ provider = "google" }: Props) {
    if (provider === "google") {
        return <GoogleMapView />;
    }

    // return <MapLibreView />;
}