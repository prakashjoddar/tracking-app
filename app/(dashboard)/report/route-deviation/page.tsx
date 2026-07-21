import { RouteDeviationReportPanel } from "@/components/report/RouteDeviationReportPanel"

export const metadata = { title: "Trip Route Deviation | Tracking Toe" }

export default function RouteDeviationReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <RouteDeviationReportPanel />
        </div>
    )
}
