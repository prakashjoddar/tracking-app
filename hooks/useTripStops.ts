import { useEffect, useState } from "react";
import { fetchStops } from "@/lib/api";
import { Stop } from "@/lib/types";

/** Fetches a trip's enabled stops once per tripId change — stops don't move mid-trip. */
export function useTripStops(tripId: number | null): Stop[] {
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    if (tripId == null) {
      setStops([]);
      return;
    }

    let cancelled = false;

    fetchStops(String(tripId))
      .then((data) => {
        if (!cancelled) setStops(data.filter((s) => s.enable));
      })
      .catch((e) => {
        console.error("Failed to fetch trip stops", e);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return stops;
}
