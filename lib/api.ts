import { VehicleLocation } from "./types";

export async function fetchVehicleLocations(): Promise<VehicleLocation[]> {
  const res = await fetch("http://localhost:6003/locations", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch vehicle locations");
  }

  return res.json();
}
