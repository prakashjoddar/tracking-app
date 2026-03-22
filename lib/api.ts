import { VehicleLocation } from "./types";

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:6004",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function fetchVehicleLocations(): Promise<VehicleLocation[]> {
  try {
    const response = await api.get<VehicleLocation[]>("/location");
    return response.data;
  } catch (error) {
    // throw new Error("Failed to fetch vehicle locations: " + error);
    return [];
  }
}

export async function fetchVehicleLocationHistory(
  vehicleNo: string,
  startDate: string,
  endDate?: string,
): Promise<VehicleLocation[]> {
  try {
    const response = await api.get<VehicleLocation[]>(
      `/location/history/${vehicleNo}/${startDate}`,
      {
        params: {
          ...(endDate && { endDate }),
        },
      },
    );

    return response.data;
  } catch (error) {
    // throw new Error("Failed to fetch vehicle locations: " + error);
    return [];
  }
}
