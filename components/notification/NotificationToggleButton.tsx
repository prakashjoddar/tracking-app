"use client"

import { Bell } from "lucide-react"
import { useNotificationStore } from "@/store/notification-store"

export function NotificationToggleButton() {
    const isOpen = useNotificationStore((s) => s.isOpen)
    const unreadCount = useNotificationStore((s) => s.unreadCount)
    const toggle = useNotificationStore((s) => s.toggle)

    if (isOpen) return null

    return (
        <div className="fixed bottom-4 right-4 z-45">
            <button
                className="relative flex items-center justify-center w-12 h-12 bg-gray-900 shadow-lg border rounded-full hover:bg-gray-700 text-white transition-colors"
                onClick={toggle}
                title="Notifications"
            >
                <Bell className="size-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>
        </div>
    )
}
