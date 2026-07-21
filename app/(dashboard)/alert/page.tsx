import { AlertPanel } from "@/components/alert/AlertPanel"

export const metadata = {
    title: "Alerts | Tracking Toe",
}

export default function AlertPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <AlertPanel />
        </div>
    )
}
