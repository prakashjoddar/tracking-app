import { DaywiseDistanceReportPanel } from "@/components/report/DaywiseDistanceReportPanel"

export const metadata = { title: "Day-wise Distance Report | Tracking Toe" }

export default function DaywiseDistanceReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <DaywiseDistanceReportPanel />
        </div>
    )
}
