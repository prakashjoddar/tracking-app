import { MessagePanel } from "@/components/message/MessagePanel"

export const metadata = { title: "Messages | Tracking Toe" }

export default function MessagePage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <MessagePanel />
        </div>
    )
}
