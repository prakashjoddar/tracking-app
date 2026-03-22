"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useTripStore } from "@/store/trip-store"
import { Stop } from "@/lib/types"

type Suggestion = {
    placeId: string
    mainText: string
    secondaryText: string
}

export function PlaceSearch() {

    const [query, setQuery] = useState<string>("")
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [open, setOpen] = useState<boolean>(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)

    const addStop = useTripStore(s => s.addStop)
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)
    const snapToRoute = useTripStore.getState().snapToRoute


    const getSessionToken = (): google.maps.places.AutocompleteSessionToken => {
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
        }
        return sessionTokenRef.current
    }

    const resetSessionToken = (): void => {
        sessionTokenRef.current = null
    }

    useEffect(() => {
        if (!query || query.length < 2) {
            setSuggestions([])
            setOpen(false)
            return
        }

        const fetchSuggestions = async (): Promise<void> => {
            try {
                const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: query,
                    sessionToken: getSessionToken(),
                })

                setSuggestions(
                    suggestions
                        .filter(s => s.placePrediction != null)
                        .map(s => {
                            const p = s.placePrediction!
                            return {
                                placeId: p.placeId,
                                mainText: p.mainText?.text ?? p.text.text,
                                secondaryText: p.secondaryText?.text ?? "",
                            }
                        })
                )
                setOpen(true)
            } catch (e) {
                console.error("Autocomplete error:", e)
            }
        }

        const debounce = setTimeout(fetchSuggestions, 300)
        return () => clearTimeout(debounce)

    }, [query])

    const handleSelect = async (suggestion: Suggestion): Promise<void> => {
        setQuery(suggestion.mainText)
        setOpen(false)

        try {
            const place = new google.maps.places.Place({ id: suggestion.placeId })
            await place.fetchFields({ fields: ["location", "displayName"] })

            resetSessionToken()

            const lat: number | undefined = place.location?.lat()
            const lng: number | undefined = place.location?.lng()
            if (lat == null || lng == null) return

            const newStop: Stop = {
                id: crypto.randomUUID(),
                name: place.displayName ?? suggestion.mainText,
                latitude: lat,
                longitude: lng,
                type: "point",
                enabled: true,
                snapToRoute
            }

            addStop(newStop)
            setPendingLatLng({ lat, lng })
            setQuery("")

        } catch (e) {
            console.error("Place details error:", e)
        }
    }

    const handleClear = (): void => {
        setQuery("")
        setSuggestions([])
        setOpen(false)
        resetSessionToken()
        inputRef.current?.focus()
    }

    return (
        // 👇 top-right, nudged left to sit beside the fullscreen button
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[450px]">

            <div className="flex items-center bg-white rounded-lg shadow-lg border px-3 py-2 gap-2">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    placeholder="Search for a place..."
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 w-full"
                />
                {query && (
                    <button onClick={handleClear} type="button">
                        <X size={15} className="text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <div className="mt-1 bg-white rounded-lg shadow-xl border overflow-hidden">
                    {suggestions.map((s: Suggestion) => (
                        <button
                            key={s.placeId}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0"
                        >
                            <Search size={14} className="text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {s.mainText}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {s.secondaryText}
                                </p>
                            </div>
                        </button>
                    ))}
                    <div className="flex justify-end px-3 py-1.5 bg-gray-50">
                        <img
                            src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
                            alt="Powered by Google"
                            className="h-4"
                        />
                    </div>
                </div>
            )}

        </div>
    )
}