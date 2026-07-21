import { OverSpeedReportPanel } from "@/components/report/OverSpeedReportPanel"

export const metadata = { title: "Over Speed Report | Tracking Toe" }

export default function OverSpeedReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <OverSpeedReportPanel />
        </div>
    )
}
