"use client"

import { useEffect, useState } from "react"
import { StopProposalPanel } from "@/components/stop-proposal/StopProposalPanel"
import { StopProposalMapEngine } from "@/components/stop-proposal/StopProposalMapEngine"
import { StopProposal } from "@/lib/types"
import { useCurrentUserStore } from "@/store/current-user-store"

export default function StopRequestsPage() {
    const [selected, setSelected] = useState<StopProposal | null>(null)

    const mapProvider = useCurrentUserStore((s) => s.user?.mapProvider) === "MAPLIBRE" ? "maplibre" : "google"
    const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce)
    useEffect(() => { fetchCurrentUserOnce() }, [fetchCurrentUserOnce])

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="w-[420px] border-r flex flex-col h-full overflow-hidden">
                <StopProposalPanel selectedProposalId={selected?.id ?? null} onSelectProposal={setSelected} />
            </div>
            <div className="flex-1 min-w-0 relative h-full">
                <StopProposalMapEngine provider={mapProvider} proposal={selected} />
            </div>
        </div>
    )
}
