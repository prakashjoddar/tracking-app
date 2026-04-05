import { create } from "zustand";
import { VehicleLocation, VehicleHistoryPoint } from "@/lib/types";

type LocationHistory = {
  [vehicleNo: string]: {
    [date: string]: VehicleHistoryPoint[];
  };
};

type State = {
  vehicles: VehicleLocation[];
  locationHistory: LocationHistory;

  setVehicles: (data: VehicleLocation[]) => void;

  setLocationHistory: (
    vehicleNo: string,
    date: string,
    data: VehicleHistoryPoint[],
  ) => void;
};

export const useVehicleStore = create<State>((set) => ({
  vehicles: [],

  locationHistory: {},

  setVehicles: (data) => set({ vehicles: data }),

  setLocationHistory: (vehicleNo, date, data) =>
    set((state) => ({
      locationHistory: {
        ...state.locationHistory,
        [vehicleNo]: {
          ...state.locationHistory[vehicleNo],
          [date]: data,
        },
      },
    })),
}));
