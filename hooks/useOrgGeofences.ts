import { useEffect } from "react";
import { fetchGeofences } from "@/lib/api";
import { useGeofenceStore } from "@/store/geofence-store";

/** Lazily loads the org's geofences into the shared store the first time they're needed. */
export function useOrgGeofences(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (useGeofenceStore.getState().geofences.length > 0) return;

    let cancelled = false;

    fetchGeofences()
      .then((data) => {
        if (!cancelled) useGeofenceStore.getState().setGeofences(data);
      })
      .catch((e) => console.error("Failed to fetch geofences", e));

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
