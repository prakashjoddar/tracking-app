import { MapSettingsPanel } from "@/components/settings/MapSettingsPanel"

export const metadata = {
    title: "Map Settings | Tracking Toe",
}

export default function MapSettingsPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <MapSettingsPanel />
        </div>
    )
}
