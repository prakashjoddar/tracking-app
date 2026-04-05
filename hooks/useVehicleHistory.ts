import { useEffect } from "react";
import { useHistoryStore } from "@/store/history-store";

export function useVehicleHistory(vehicleNo: string, date: string) {
  const setPoints = useHistoryStore((s) => s.setPoints);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `http://localhost:6003/location/history/${vehicleNo}/${date}`,
      );

      const data = await res.json();

      setPoints(data);
    }

    load();
  }, [vehicleNo, date]);
}
