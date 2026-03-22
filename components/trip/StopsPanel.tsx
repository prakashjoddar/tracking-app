"use client"

import StopForm from "./StopForm"
import StopListPanel from "./StopListPanel"

export default function StopsPanel() {
    return (
        <div className="flex h-full w-full">

            {/* LEFT PANEL */}
            <div className="w-[420px] border-r p-4 overflow-y-auto">
                <StopListPanel />
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 p-6">
                {/* <StopForm /> */}
            </div>

        </div>
    )
}