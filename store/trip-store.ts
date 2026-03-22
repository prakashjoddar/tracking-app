import { Stop } from "@/lib/types";
import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type State = {
  showMapOrStopForm: boolean;

  setShowMapOrStopForm: (val: boolean) => void;
  toggleShowMapOrStopForm: () => void;
  resetTrip: () => void;

  stops: Stop[];
  pendingLatLng: { lat: number; lng: number } | null;
  setPendingLatLng: (latlng: { lat: number; lng: number } | null) => void;
  addStop: (stop: Stop) => void;
  removeStop: (id: string) => void;
  updateStopPosition: (id: string, lat: number, lng: number) => void;
  reorderStops: (oldIndex: number, newIndex: number) => void;

  snapToRoute: boolean;
  setSnapToRoute: (val: boolean) => void;

  editingStopId: string | null;
  setEditingStopId: (id: string | null) => void;
  updateStop: (id: string, data: Partial<Stop>) => void;
};

export const useTripStore = create<State>()(
  // 👈 extra ()
  devtools(
    // 👈 open devtools
    (set) => ({
      showMapOrStopForm: false,
      setShowMapOrStopForm: (p) =>
        set({ showMapOrStopForm: p }, false, "setShowMapOrStopForm"),
      toggleShowMapOrStopForm: () =>
        set(
          (s) => ({ showMapOrStopForm: !s.showMapOrStopForm }),
          false,
          "toggleShowMapOrStopForm",
        ),
      resetTrip: () => set({ showMapOrStopForm: false }, false, "resetTrip"),

      stops: [],
      pendingLatLng: null,
      setPendingLatLng: (latlng) =>
        set({ pendingLatLng: latlng }, false, "setPendingLatLng"),
      addStop: (stop) =>
        set((s) => ({ stops: [...s.stops, stop] }), false, "addStop"),
      removeStop: (id) =>
        set(
          (s) => ({ stops: s.stops.filter((s) => s.id !== id) }),
          false,
          "removeStop",
        ),
      updateStopPosition: (id: string, lat: number, lng: number) =>
        set(
          (s) => ({
            stops: s.stops.map((stop) =>
              stop.id === id
                ? { ...stop, latitude: lat, longitude: lng }
                : stop,
            ),
          }),
          false,
          "updateStopPosition",
        ),
      reorderStops: (oldIndex: number, newIndex: number) =>
        set(
          (s) => ({
            stops: arrayMove(s.stops, oldIndex, newIndex),
          }),
          false,
          "reorderStops",
        ),

      snapToRoute: true, // default on
      setSnapToRoute: (val) => set({ snapToRoute: val }, false),

      editingStopId: null,
      setEditingStopId: (id) => set({ editingStopId: id }, false),
      updateStop: (id, data) =>
        set(
          (s) => ({
            stops: s.stops.map((stop) =>
              stop.id === id ? { ...stop, ...data } : stop,
            ),
          }),
          false,
        ),
    }),
    { name: "TripStore" }, // 👈 close devtools
  ),
);

// export const useTripStore = create<State>((set) => ({
//   showMapOrStopForm: false,
//   setShowMapOrStopForm: (p) => set({ showMapOrStopForm: p }),
//   toggleShowMapOrStopForm: () =>
//     set((s) => ({ showMapOrStopForm: !s.showMapOrStopForm })),
//   resetTrip: () => set({ showMapOrStopForm: false }),

//   stops: [],
//   pendingLatLng: null,
//   setPendingLatLng: (latlng) => set({ pendingLatLng: latlng }),
//   addStop: (stop) => set((s) => ({ stops: [...s.stops, stop] })),
//   removeStop: (id) =>
//     set((s) => ({ stops: s.stops.filter((s) => s.id !== id) })),
//   updateStopPosition: (id: string, lat: number, lng: number) =>
//     set((s) => ({
//       stops: s.stops.map((stop) =>
//         stop.id === id ? { ...stop, latitude: lat, longitude: lng } : stop,
//       ),
//     })),

//   reorderStops: (oldIndex: number, newIndex: number) =>
//     set((s) => ({
//       stops: arrayMove(s.stops, oldIndex, newIndex),
//     })),
// }));
