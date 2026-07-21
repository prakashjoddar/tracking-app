import { IgnitionReportPanel } from "@/components/report/IgnitionReportPanel"

export const metadata = { title: "Ignition Report | Tracking Toe" }

export default function IgnitionReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <IgnitionReportPanel />
        </div>
    )
}
