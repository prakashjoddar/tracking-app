import { DriverStaffPanel } from "@/components/user/DriverStaffPanel"

export const metadata = {
    title: "Driver & Supervisor | Tracking Toe Dashboard",
}

export default function DriverStaffPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <DriverStaffPanel />
        </div>
    )
}
