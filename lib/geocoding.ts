export type PlaceSuggestion = {
    id: string;
    mainText: string;
    secondaryText: string;
    /** Present immediately for OSM results; undefined for Google until resolve() is called. */
    lat?: number;
    lng?: number;
};

export type ResolvedPlace = {
    lat: number;
    lng: number;
    displayName: string;
};

async function searchGoogle(query: string, sessionToken: google.maps.places.AutocompleteSessionToken): Promise<PlaceSuggestion[]> {
    const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken,
    });

    return suggestions
        .filter((s) => s.placePrediction != null)
        .map((s) => {
            const p = s.placePrediction!;
            return {
                id: p.placeId,
                mainText: p.mainText?.text ?? p.text.text,
                secondaryText: p.secondaryText?.text ?? "",
            };
        });
}

async function resolveGoogle(suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> {
    const place = new google.maps.places.Place({ id: suggestion.id });
    await place.fetchFields({ fields: ["location", "displayName"] });

    const lat = place.location?.lat();
    const lng = place.location?.lng();
    if (lat == null || lng == null) return null;

    return { lat, lng, displayName: place.displayName ?? suggestion.mainText };
}

/**
 * Nominatim's public endpoint — free, no API key, but its usage policy caps
 * autocomplete-on-keystroke volume for production use without self-hosting.
 * Fine for low-volume orgs; self-host Nominatim/Photon if this becomes heavy traffic.
 */
async function searchOsm(query: string): Promise<PlaceSuggestion[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=0&limit=6`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return [];

    const data: Array<{ place_id: number; display_name: string; lat: string; lon: string }> = await res.json();
    return data.map((item) => {
        const [mainText, ...rest] = item.display_name.split(",");
        return {
            id: String(item.place_id),
            mainText: mainText.trim(),
            secondaryText: rest.join(",").trim(),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
        };
    });
}

/** Encapsulates a single search session (Google's session-token billing lifecycle, or plain OSM lookups). */
export class PlaceSearchSession {
    readonly provider: "GOOGLE" | "OSM";
    private googleSessionToken: google.maps.places.AutocompleteSessionToken | null = null;

    constructor(provider: "GOOGLE" | "OSM") {
        this.provider = provider;
    }

    private getGoogleSessionToken(): google.maps.places.AutocompleteSessionToken {
        if (!this.googleSessionToken) {
            this.googleSessionToken = new google.maps.places.AutocompleteSessionToken();
        }
        return this.googleSessionToken;
    }

    async search(query: string): Promise<PlaceSuggestion[]> {
        if (this.provider === "OSM") return searchOsm(query);
        return searchGoogle(query, this.getGoogleSessionToken());
    }

    async resolve(suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> {
        if (this.provider === "OSM") {
            if (suggestion.lat == null || suggestion.lng == null) return null;
            return { lat: suggestion.lat, lng: suggestion.lng, displayName: suggestion.mainText };
        }
        const result = await resolveGoogle(suggestion);
        this.resetSession();
        return result;
    }

    /** Google session tokens are billed per completed search — reset once a selection is made. */
    resetSession(): void {
        this.googleSessionToken = null;
    }
}
