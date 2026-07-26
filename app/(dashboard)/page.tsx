"use client";

import { useEffect } from "react";
import { MapsPanel } from "@/components/dashboard/maps-panel";
import { MapEngine } from "@/components/map/MapEngine";
import { useCurrentUserStore } from "@/store/current-user-store";

export default function MapsPage() {
  const user = useCurrentUserStore((s) => s.user);
  const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce);

  useEffect(() => {
    fetchCurrentUserOnce();
  }, [fetchCurrentUserOnce]);

  const provider = user?.mapProvider === "MAPLIBRE" ? "maplibre" : "google";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapEngine provider={provider} />
      <MapsPanel />
    </div>
  );
}
