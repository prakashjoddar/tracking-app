import { TimelineReportPanel } from "@/components/report/TimelineReportPanel"

export const metadata = { title: "Timeline | Tracking Toe" }

export default function TimelineReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <TimelineReportPanel />
        </div>
    )
}
