"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChevronRight } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function FloatingSidebarTrigger() {
    const { state } = useSidebar()
    const { toggleSidebar } = useSidebar()


    if (state === "expanded") return null

    return (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">

            <button
                className="
                    flex items-center justify-center
                    w-8 h-14
                    bg-gray-900 shadow-lg border
                    rounded-r-full
                    hover:bg-gray-500
                    text-white
                "
                onClick={() => toggleSidebar()}
            >
                <ChevronRight className="size-7" />
            </button>

        </div>
    )
}