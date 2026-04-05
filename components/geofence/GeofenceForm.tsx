"use client"

import { useEffect, useState, useRef } from "react"
import { Geofence } from "@/lib/types"
import { useGeofenceStore } from "@/store/geofence-store"
import { Input } from "@/components/ui/input"
import { Save, Circle, MapPin, Navigation, Tag, X, Loader2 } from "lucide-react"
import { saveGeofence } from "@/lib/api"
import { toast } from "sonner"

type Mode = "add" | "edit"

type GeofenceFormProps = {
    mode: Mode
    onClose: () => void
}

const defaultForm: Geofence = {
    name: "",
    enable: true,
    latitude: 0,
    longitude: 0,
    radius: 150,
    color: "#3b82f6", // default blue-500
    description: "",
    address: ""
}

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {icon}
            <span>{title}</span>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {children}
        </div>
    </div>
)

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
        <label className="text-[11px] font-medium text-gray-600 ml-0.5">{label}</label>
        {children}
        {error && <p className="text-[10px] text-red-500 ml-0.5">{error}</p>}
    </div>
)

export function GeofenceForm({ mode, onClose }: GeofenceFormProps) {
    const {
        geofences, editingGeofenceId, addGeofence, updateGeofence,
        pendingLatLng, setPendingLatLng,
        setPendingRadius, setPendingColor
    } = useGeofenceStore()

    const [form, setForm] = useState<Geofence>(defaultForm)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof Geofence, string>>>({})

    const [searchQuery, setSearchQuery] = useState<string>("")
    const [suggestions, setSuggestions] = useState<{ placeId: string; mainText: string; secondaryText: string }[]>([])
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
    const mapSyncDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Load editing data
    useEffect(() => {
        if (mode === "edit" && editingGeofenceId) {
            const current = geofences.find(g => g.id === editingGeofenceId)
            if (current) {
                setForm({ ...current })
                setPendingLatLng({ lat: current.latitude, lng: current.longitude })
                setPendingRadius(current.radius)
                setPendingColor(current.color || "#fb923c")
            }
        } else {
            setForm(defaultForm)
            setPendingLatLng(null)
            setPendingRadius(150)
            setPendingColor("#fb923c")
        }
        setErrors({})

        // Cleanup on unmount/close
        return () => {
            useGeofenceStore.getState().setPendingLatLng(null)
        }
    }, [mode, editingGeofenceId, geofences])

    // Sync form to store for map preview — coords immediately, radius/color debounced to prevent crash on rapid input
    useEffect(() => {
        if (form.latitude !== 0 || form.longitude !== 0) {
            useGeofenceStore.getState().setPendingLatLng({ lat: form.latitude, lng: form.longitude })
        }
        if (mapSyncDebounce.current) clearTimeout(mapSyncDebounce.current)
        mapSyncDebounce.current = setTimeout(() => {
            setPendingRadius(form.radius > 0 ? form.radius : 150)
            setPendingColor(form.color || "#3b82f6")
        }, 80)
    }, [form.latitude, form.longitude, form.radius, form.color])

    // Update from map pick (from store back to form)
    useEffect(() => {
        if (pendingLatLng) {
            setForm(prev => ({ ...prev, latitude: pendingLatLng.lat, longitude: pendingLatLng.lng }))
        }
    }, [pendingLatLng])

    // Google Places Search init
    // useEffect(() => {
    //     if (!searchInputRef.current || !window.google) return

    //     const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
    //         fields: ["geometry", "formatted_address", "name"]
    //     })

    //     autocomplete.addListener("place_changed", () => {
    //         const place = autocomplete.getPlace()
    //         if (place.geometry?.location) {
    //             setForm(prev => ({
    //                 ...prev,
    //                 latitude: place.geometry!.location!.lat(),
    //                 longitude: place.geometry!.location!.lng(),
    //                 address: place.formatted_address || place.name || prev.address
    //             }))
    //         }
    //     })
    // }, [])

    // Remove the useEffect with new google.maps.places.Autocomplete(...)
    // Replace with the same pattern as PlaceSearch.tsx

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const fetch = async (): Promise<void> => {
            try {
                const token = new google.maps.places.AutocompleteSessionToken()
                const { suggestions } = await google.maps.places.AutocompleteSuggestion
                    .fetchAutocompleteSuggestions({ input: searchQuery, sessionToken: token })

                setSuggestions(
                    suggestions
                        .filter(s => s.placePrediction != null)
                        .map(s => ({
                            placeId: s.placePrediction!.placeId,
                            mainText: s.placePrediction!.mainText?.text ?? "",
                            secondaryText: s.placePrediction!.secondaryText?.text ?? "",
                        }))
                )
                setShowSuggestions(true)
            } catch (e) {
                console.error("Autocomplete error:", e)
            }
        }

        const debounce = setTimeout(fetch, 300)
        return () => clearTimeout(debounce)
    }, [searchQuery])

    const handleSelectPlace = async (placeId: string, mainText: string): Promise<void> => {
        try {
            const place = new google.maps.places.Place({ id: placeId })
            await place.fetchFields({ fields: ["location", "displayName", "formattedAddress"] })

            const lat = place.location?.lat()
            const lng = place.location?.lng()
            if (!lat || !lng) return

            setForm(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                address: place.formattedAddress ?? mainText,
            }))
            setSearchQuery("")
            setSuggestions([])
            setShowSuggestions(false)
        } catch (e) {
            console.error("Place details error:", e)
        }
    }

    const validate = () => {
        const newErrors: Partial<Record<keyof Geofence, string>> = {}
        if (!form.name.trim()) newErrors.name = "Required"
        if (!form.latitude || !form.longitude) newErrors.latitude = "Invalid location"
        if (form.radius <= 0) newErrors.radius = "Must be > 0"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (): Promise<void> => {
        if (!validate()) return

        try {
            setSaving(true)
            const saved = await saveGeofence(form)
            if (mode === "edit" && editingGeofenceId) {
                updateGeofence(editingGeofenceId, saved)
                toast.success("Geofence updated")
            } else {
                addGeofence(saved)
                toast.success("Geofence created")
            }
            onClose()
        } catch (e: any) {
            console.error("Save failed:", e)
            toast.error(e.response?.data?.message || "Failed to save geofence")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Circle size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">
                            {mode === "add" ? "New Geofence" : "Edit Geofence"}
                        </h2>
                        <p className="text-[10px] text-gray-400">
                            Set up a virtual perimeter
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
                <Section icon={<Tag size={12} />} title="Identity">
                    <FormField label="Fence Name" error={errors.name}>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="h-8 text-xs"
                            placeholder="Home, Office, Warehouse..."
                        />
                    </FormField>
                    <FormField label="Status">
                        <div className="flex items-center gap-2 h-8">
                            <button
                                onClick={() => setForm({ ...form, enable: !form.enable })}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all ${form.enable
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                    }`}>
                                {form.enable ? "ENABLED" : "DISABLED"}
                            </button>
                        </div>
                    </FormField>
                    <div className="md:col-span-2">
                        <FormField label="Description">
                            <Input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="h-8 text-xs"
                                placeholder="Extra context about this perimeter"
                            />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<Navigation size={12} />} title="Location & Bounds">
                    <div className="md:col-span-2">
                        {/* <FormField label="Search Location">
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Search for a place..."
                                    className="h-8 text-xs pl-8 pr-16"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <span className="text-[9px] text-gray-300 font-bold px-1.5 py-0.5 border border-gray-100 rounded">SEARCH</span>
                                </div>
                            </div>
                        </FormField> */}

                        <FormField label="Search Location">
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5 z-10" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                                    placeholder="Search for a place..."
                                    className="h-8 text-xs pl-8"
                                />

                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                                        {suggestions.map(s => (
                                            <button
                                                key={s.placeId}
                                                type="button"
                                                onClick={() => handleSelectPlace(s.placeId, s.mainText)}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b last:border-b-0"
                                            >
                                                <span className="text-xs font-medium text-gray-800">{s.mainText}</span>
                                                <span className="text-[10px] text-gray-400">{s.secondaryText}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FormField>
                    </div>

                    <FormField label="Latitude" error={errors.latitude}>
                        <div className="relative">
                            <Input
                                type="number"
                                value={form.latitude || ""}
                                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                                className="h-8 text-xs font-mono pr-8"
                                placeholder="0.00000"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Navigation size={10} className={form.latitude !== 0 ? "text-blue-500" : "text-gray-300"} />
                            </div>
                        </div>
                    </FormField>
                    <FormField label="Longitude">
                        <Input
                            type="number"
                            value={form.longitude || ""}
                            onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                            className="h-8 text-xs font-mono"
                            placeholder="0.00000"
                        />
                    </FormField>

                    <FormField label="Radius (Meters)" error={errors.radius}>
                        <div className="relative">
                            <Input
                                type="number"
                                value={form.radius}
                                onChange={(e) => setForm({ ...form, radius: parseInt(e.target.value) || 0 })}
                                className="h-8 text-xs font-bold text-blue-600"
                                placeholder="150"
                            />
                        </div>
                    </FormField>
                    <FormField label="Fence Color">
                        <div className="flex items-center gap-2 h-8">
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                className="size-6 rounded border p-0.5 cursor-pointer bg-white"
                            />
                            <span className="font-mono text-[10px] uppercase">{form.color}</span>
                        </div>
                    </FormField>

                    <div className="md:col-span-2">
                        <div className={`p-2.5 rounded-lg border flex items-start gap-2 transition-all ${form.latitude === 0
                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                            : "bg-blue-50 border-blue-100 text-blue-700"
                            }`}>
                            <div className="mt-0.5 relative">
                                <Navigation size={12} className={form.latitude === 0 ? "animate-bounce" : ""} />
                                {form.latitude === 0 && <div className="absolute -inset-1 bg-white/30 rounded-full animate-ping" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    {form.latitude === 0 ? "Action Required: Set Location" : "Location Set"}
                                </p>
                                <p className="text-[10px] leading-relaxed opacity-90">
                                    {form.latitude === 0
                                        ? "Simply click anywhere on the map to instantly set the center of your geofence. You can also use the search box above."
                                        : `Fence center at ${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}. Click the map again to move it.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t bg-gray-50/50 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70"
                >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {saving ? "Saving..." : "Save Geofence"}
                </button>
            </div>
        </div>
    )
}
