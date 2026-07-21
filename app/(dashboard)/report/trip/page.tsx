import { TripReportPanel } from "@/components/report/TripReportPanel"

export const metadata = { title: "Trip Report | Tracking Toe" }

export default function TripReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <TripReportPanel />
        </div>
    )
}
