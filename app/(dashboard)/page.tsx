"use client";

import { MapView } from "@/components/dashboard/map-view";
import { MapsPanel } from "@/components/dashboard/maps-panel";
import { MapControls } from "@/components/dashboard/map-controls";
import { MapEngine } from "@/components/map/MapEngine";

export default function MapsPage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* <MapView /> */}
      {/* <MapControls /> */}

      <MapEngine provider="google" />
      <MapsPanel />
    </div>
  );
}
