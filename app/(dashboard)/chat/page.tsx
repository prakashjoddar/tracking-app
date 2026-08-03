import { ChatPanel } from "@/components/chat/ChatPanel"

export const metadata = { title: "Chat | Tracking Toe" }

export default function ChatPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <ChatPanel />
        </div>
    )
}
