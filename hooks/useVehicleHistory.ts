import { useEffect } from "react";
import { useHistoryStore } from "@/store/history-store";
import { api } from "@/lib/api";

export function useVehicleHistory(vehicleNo: string, date: string) {
  const setPoints = useHistoryStore((s) => s.setPoints);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get(`/location/history/${vehicleNo}/${date}`);
        // Guard against a slow, now-stale request resolving after a newer
        // vehicleNo/date was selected (or the component unmounted).
        if (!cancelled) setPoints(data);
      } catch (err) {
        console.error("Vehicle history fetch error", err);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [vehicleNo, date, setPoints]);
}
