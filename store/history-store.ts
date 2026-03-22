import { create } from "zustand";
import { VehicleHistoryPoint } from "@/lib/types";
import { devtools } from "zustand/middleware";

type State = {
  points: VehicleHistoryPoint[];
  index: number;
  playing: boolean;

  setPoints: (p: VehicleHistoryPoint[]) => void;
  setIndex: (i: number) => void;
  togglePlay: () => void;
};

export const useHistoryStore = create<State>()(
  devtools((set) => ({
    points: [],
    index: 0,
    playing: false,

    setPoints: (p) => set({ points: p }),
    setIndex: (i) => set({ index: i }),
    togglePlay: () => set((s) => ({ playing: !s.playing })),
  })),
);
