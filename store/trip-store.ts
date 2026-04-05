import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { Trip, Stop } from "@/lib/types";

type State = {
  // ── UI ──────────────────────────────────────────
  showMapOrStopForm: boolean;
  setShowMapOrStopForm: (val: boolean) => void;
  toggleShowMapOrStopForm: () => void;
  resetTrip: () => void;

  // ── Trip list ────────────────────────────────────
  trips: Trip[];
  selectedTripId: string | null;
  editingTripId: string | null;
  tripsLoading: boolean;
  setTrips: (trips: Trip[]) => void;
  setSelectedTripId: (id: string | null) => void;
  setEditingTripId: (id: string | null) => void;
  setTripsLoading: (val: boolean) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, data: Partial<Trip>) => void;
  removeTrip: (id: string) => void;

  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;

  // ── Stop list ────────────────────────────────────
  stops: Stop[];
  deletedStopIds: string[];
  editingStopId: string | null;
  pendingLatLng: { lat: number; lng: number } | null;
  snapToRoute: boolean;
  stopsLoading: boolean;
  setStops: (stops: Stop[]) => void;
  setEditingStopId: (id: string | null) => void;
  setPendingLatLng: (latlng: { lat: number; lng: number } | null) => void;
  setSnapToRoute: (val: boolean) => void;
  setStopsLoading: (val: boolean) => void;
  addStop: (stop: Stop) => void;
  updateStop: (id: string, data: Partial<Stop>) => void;
  removeStop: (id: string) => void;
  markStopDeleted: (id: string) => void;
  clearDeletedStops: () => void;
  updateStopPosition: (id: string, lat: number, lng: number) => void;
  reorderStops: (oldIndex: number, newIndex: number) => void;
};

export const useTripStore = create<State>()(
  devtools(
    (set) => ({
      showMapOrStopForm: false,
      setShowMapOrStopForm: (p) => set({ showMapOrStopForm: p }),
      toggleShowMapOrStopForm: () =>
        set((s) => ({ showMapOrStopForm: !s.showMapOrStopForm })),
      resetTrip: () => set({ showMapOrStopForm: false }),

      trips: [],
      selectedTripId: null,
      editingTripId: null,
      tripsLoading: false,
      setTrips: (trips) => set({ trips }),
      setSelectedTripId: (id) => set({ selectedTripId: id }),
      setEditingTripId: (id) => set({ editingTripId: id }),
      setTripsLoading: (val) => set({ tripsLoading: val }),
      addTrip: (trip) => set((s) => ({ trips: [trip, ...s.trips] })),
      updateTrip: (id, data) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      removeTrip: (id) =>
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),

      selectedVehicleId: null,
      setSelectedVehicleId: (vehicleId) =>
        set({ selectedVehicleId: vehicleId }),

      stops: [],
      deletedStopIds: [],
      editingStopId: null,
      pendingLatLng: null,
      snapToRoute: true,
      stopsLoading: false,
      setStops: (stops) => set({ stops }),
      setEditingStopId: (id) => set({ editingStopId: id }),
      setPendingLatLng: (latlng) => set({ pendingLatLng: latlng }),
      setSnapToRoute: (val) => set({ snapToRoute: val }),
      setStopsLoading: (val) => set({ stopsLoading: val }),
      addStop: (stop) => set((s) => ({ stops: [...s.stops, stop] })),
      updateStop: (id, data) =>
        set((s) => ({
          stops: s.stops.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
      removeStop: (id) =>
        set((s) => ({ stops: s.stops.filter((s) => s.id !== id) })),
      markStopDeleted: (id) =>
        set((s) => ({
          stops: s.stops.filter((stop) => stop.id !== id),
          deletedStopIds: s.deletedStopIds.includes(id)
            ? s.deletedStopIds
            : [...s.deletedStopIds, id],
        })),
      clearDeletedStops: () => set({ deletedStopIds: [] }),
      updateStopPosition: (id, lat, lng) =>
        set((s) => ({
          stops: s.stops.map((stop) =>
            stop.id === id ? { ...stop, latitude: lat, longitude: lng } : stop,
          ),
        })),
      reorderStops: (oldIndex, newIndex) =>
        set((s) => ({
          stops: arrayMove(s.stops, oldIndex, newIndex),
        })),
    }),
    { name: "TripStore" },
  ),
);
