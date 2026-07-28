import { VehicleReplacementReportPanel } from "@/components/report/VehicleReplacementReportPanel"

export const metadata = { title: "Vehicle Replacement Report | Tracking Toe" }

export default function VehicleReplacementReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <VehicleReplacementReportPanel />
        </div>
    )
}
