import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Vehicle } from "@/lib/types";

type VehicleState = {
  vehicles: Vehicle[];
  editingVehicleId: string | null;
  loading: boolean;
  setVehicles: (vehicles: Vehicle[]) => void;
  setEditingVehicleId: (id: string | null) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setLoading: (val: boolean) => void;
  fetchVehicles: () => Promise<void>;
};

export const useVehicleManageStore = create<VehicleState>()(
  devtools(
    (set) => ({
      vehicles: [],
      editingVehicleId: null,
      loading: false,

      setVehicles: (vehicles) => set({ vehicles }),
      setEditingVehicleId: (id) => set({ editingVehicleId: id }),
      setLoading: (val) => set({ loading: val }),
      addVehicle: (vehicle) =>
        set((s) => ({ vehicles: [vehicle, ...s.vehicles] })),
      updateVehicle: (id, data) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) =>
            v.id === id ? { ...v, ...data } : v,
          ),
        })),
      deleteVehicle: (id) =>
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
        })),
      fetchVehicles: async () => {
        const { api } = await import("@/lib/api");
        set({ loading: true });
        try {
          const res = await api.get<Vehicle[]>("/vehicle");
          set({ vehicles: res.data });
        } catch (e) {
          console.error("Failed to fetch vehicles", e);
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: "VehicleManageStore" },
  ),
);
