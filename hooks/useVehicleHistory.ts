import { useEffect } from "react";
import { useHistoryStore } from "@/store/history-store";
import { api } from "@/lib/api";

export function useVehicleHistory(vehicleNo: string, date: string) {
  const setPoints = useHistoryStore((s) => s.setPoints);

  useEffect(() => {
    async function load() {
      const { data } = await api.get(`/location/history/${vehicleNo}/${date}`);
      setPoints(data);
    }

    load();
  }, [vehicleNo, date]);
}
