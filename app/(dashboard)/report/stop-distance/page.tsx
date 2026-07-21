import { StopDistanceReportPanel } from "@/components/report/StopDistanceReportPanel"

export const metadata = { title: "Stop Distance Report | Tracking Toe" }

export default function StopDistanceReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <StopDistanceReportPanel />
        </div>
    )
}
