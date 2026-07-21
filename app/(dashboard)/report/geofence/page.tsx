import { GeofenceReportPanel } from "@/components/report/GeofenceReportPanel"

export const metadata = { title: "Geofence Report | Tracking Toe" }

export default function GeofenceReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <GeofenceReportPanel />
        </div>
    )
}
