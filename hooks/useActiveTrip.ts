import { useEffect, useState } from "react";
import { fetchActiveTrip } from "@/lib/api";
import { ActiveTrip } from "@/lib/types";

const POLL_MS = 8000;

/** Polls gps_api for a vehicle's currently active trip — null when it has none. */
export function useActiveTrip(vehicleNo: string | null): ActiveTrip | null {
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);

  useEffect(() => {
    if (!vehicleNo) {
      setActiveTrip(null);
      return;
    }

    let cancelled = false;

    async function load() {
      const trip = await fetchActiveTrip(vehicleNo!);
      if (!cancelled) setActiveTrip(trip);
    }

    load();
    const interval = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [vehicleNo]);

  return activeTrip;
}
