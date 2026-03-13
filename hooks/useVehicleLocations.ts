import { useEffect } from "react";
import { fetchVehicleLocations } from "@/lib/api";
import { useVehicleStore } from "@/store/location-store";

export function useVehicleLocations(fetchLocations = true) {
  if (!fetchLocations) return;

  const setVehicles = useVehicleStore((s) => s.setVehicles);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchVehicleLocations();
        setVehicles(data);
      } catch (err) {
        console.error("Vehicle fetch error", err);
      }
    }

    load();

    // 🔁 poll every 8 sec
    const interval = setInterval(load, 8000);

    return () => clearInterval(interval);
  }, [setVehicles]);
}
