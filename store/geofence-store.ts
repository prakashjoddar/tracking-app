import { create } from "zustand"
import { Geofence } from "@/lib/types"

interface GeofenceState {
  geofences: Geofence[]
  loading: boolean
  editingGeofenceId: string | null
  pendingLatLng: { lat: number; lng: number } | null
  pendingRadius: number
  pendingColor: string

  setGeofences: (geofences: Geofence[]) => void
  addGeofence: (geofence: Geofence) => void
  updateGeofence: (id: string, geofence: Geofence) => void
  removeGeofence: (id: string) => void
  setEditingGeofence: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setPendingLatLng: (latLng: { lat: number; lng: number } | null) => void
  setPendingRadius: (radius: number) => void
  setPendingColor: (color: string) => void
}

export const useGeofenceStore = create<GeofenceState>((set) => ({
  geofences: [],
  loading: false,
  editingGeofenceId: null,
  pendingLatLng: null,
  pendingRadius: 150,
  pendingColor: "#fb923c",

  setGeofences: (geofences) => set({ geofences }),
  addGeofence: (geofence) => set((state) => ({ 
    geofences: [geofence, ...state.geofences] 
  })),
  updateGeofence: (id, geofence) => set((state) => ({
    geofences: state.geofences.map((g) => (g.id === id ? geofence : g))
  })),
  removeGeofence: (id) => set((state) => ({
    geofences: state.geofences.filter((g) => g.id !== id)
  })),
  setEditingGeofence: (id) => set({ editingGeofenceId: id }),
  setLoading: (loading) => set({ loading }),
  setPendingLatLng: (pendingLatLng) => set({ pendingLatLng }),
  setPendingRadius: (pendingRadius) => set({ pendingRadius }),
  setPendingColor: (pendingColor) => set({ pendingColor }),
}))
