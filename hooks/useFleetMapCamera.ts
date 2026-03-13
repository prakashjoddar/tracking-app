import { useEffect } from "react";
import { VehicleLocation } from "@/lib/types";
import { log } from "console";

type Props = {
  map: google.maps.Map | null;
  vehicles: VehicleLocation[];
  followVehicleId: string | null;
  activeVehicleId: string | null;
  autoFocus: boolean;
};

function shouldRecenterMap(map: google.maps.Map, lat: number, lng: number) {
  const bounds = map.getBounds();
  if (!bounds) return true;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latRange = ne.lat() - sw.lat();
  const lngRange = ne.lng() - sw.lng();

  const safeLatMin = sw.lat() + latRange * 0.3;
  const safeLatMax = ne.lat() - latRange * 0.3;

  const safeLngMin = sw.lng() + lngRange * 0.3;
  const safeLngMax = ne.lng() - lngRange * 0.3;

  return (
    lat < safeLatMin || lat > safeLatMax || lng < safeLngMin || lng > safeLngMax
  );
}

export function useFleetMapCamera({
  map,
  vehicles,
  followVehicleId,
  activeVehicleId,
  autoFocus,
}: Props) {
  useEffect(() => {
    if (!map || !autoFocus) return;

    const targetVehicle =
      vehicles.find((v) => v.vehicleNo === followVehicleId) ||
      vehicles.find((v) => v.vehicleNo === activeVehicleId);

    if (!targetVehicle) return;

    const zoom = map.getZoom() || 5;

    let centerNeeded = shouldRecenterMap(
      map,
      targetVehicle.latitude,
      targetVehicle.longitude,
    );

    let zoomNeeded = zoom < 16;

    if (centerNeeded || zoomNeeded) {
      map.moveCamera({
        center: centerNeeded
          ? {
              lat: targetVehicle.latitude,
              lng: targetVehicle.longitude,
            }
          : map.getCenter(),
        zoom: zoomNeeded ? 16 : zoom,
      });
    }
  }, [map, vehicles, followVehicleId, activeVehicleId, autoFocus]);
}
