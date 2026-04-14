import { useEffect } from "react";
import { useHistoryStore } from "@/store/history-store";
import { BASE_URL } from "@/lib/api";

export function useVehicleHistory(vehicleNo: string, date: string) {
  const setPoints = useHistoryStore((s) => s.setPoints);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        BASE_URL + `/location/history/${vehicleNo}/${date}`,
      );

      const data = await res.json();

      setPoints(data);
    }

    load();
  }, [vehicleNo, date]);
}
