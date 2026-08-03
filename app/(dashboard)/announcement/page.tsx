import { AnnouncementPanel } from "@/components/announcement/AnnouncementPanel"

export const metadata = { title: "Announcements | Tracking Toe" }

export default function AnnouncementPage() {
    return (
        <div className="flex-1 bg-white rounded-lg border shadow-sm h-[calc(100vh-2rem)] m-4 overflow-hidden">
            <AnnouncementPanel />
        </div>
    )
}
