import { ErpProvidersPanel } from "@/components/settings/ErpProvidersPanel"

export const metadata = {
    title: "ERP Providers | Tracking Toe",
}

export default function ErpProvidersPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <ErpProvidersPanel />
        </div>
    )
}
