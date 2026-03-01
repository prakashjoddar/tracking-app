import { create } from "zustand";
import { VehicleLocation } from "@/lib/types";

type State = {
  vehicles: VehicleLocation[];
  setVehicles: (data: VehicleLocation[]) => void;
};

export const useVehicleStore = create<State>((set) => ({
  vehicles: [],
  setVehicles: (data) => set({ vehicles: data }),
}));
