import { VehicleReportPanel } from "@/components/report/VehicleReportPanel"

export const metadata = { title: "Vehicle Report | Tracking Toe" }

export default function VehicleReportPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <VehicleReportPanel />
        </div>
    )
}
