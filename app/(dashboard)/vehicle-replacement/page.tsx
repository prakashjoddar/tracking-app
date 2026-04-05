import { VehicleReplacementPanel } from "@/components/vehicle/VehicleReplacementPanel"

export const metadata = {
    title: "Vehicle Replacement | Tracking Toe",
}

export default function VehicleReplacementPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <VehicleReplacementPanel />
        </div>
    )
}
