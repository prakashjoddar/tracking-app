import { useEffect } from "react";
import { fetchVehicleLocations } from "@/lib/api";
import { useVehicleStore } from "@/store/location-store";

export function useVehicleLocations(fetchLocations = true, groupId: string | null = null) {
  const setVehicles = useVehicleStore((s) => s.setVehicles);

  useEffect(() => {
    // Guarding inside the effect (rather than an early return before the
    // hooks above) keeps the hook count stable across renders — bailing out
    // before calling useVehicleStore/useEffect would violate Rules of Hooks
    // the moment `fetchLocations` toggles for a mounted component.
    if (!fetchLocations) return;

    async function load() {
      try {
        const data = await fetchVehicleLocations(groupId);
        setVehicles(data);
      } catch (err) {
        console.error("Vehicle fetch error", err);
      }
    }

    load();

    // 🔁 poll every 8 sec
    const interval = setInterval(load, 8000);

    return () => clearInterval(interval);
  }, [setVehicles, fetchLocations, groupId]);
}
