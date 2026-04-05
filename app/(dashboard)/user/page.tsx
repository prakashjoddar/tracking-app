import { UserPanel } from "@/components/user/UserPanel"

export const metadata = {
    title: "User Management | Tracking Toe",
}

export default function UserPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <UserPanel />
        </div>
    )
}
