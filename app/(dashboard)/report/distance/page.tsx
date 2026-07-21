import { DistanceReportPanel } from "@/components/report/DistanceReportPanel"

export const metadata = { title: "Distance Report | Tracking Toe" }

export default function DistanceReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <DistanceReportPanel />
        </div>
    )
}
