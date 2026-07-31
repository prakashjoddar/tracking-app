"use client"

import { useState } from "react"
import { StopProposalPanel } from "@/components/stop-proposal/StopProposalPanel"
import { StopProposalMap } from "@/components/stop-proposal/StopProposalMap"
import { StopProposal } from "@/lib/types"

export default function StopRequestsPage() {
    const [selected, setSelected] = useState<StopProposal | null>(null)

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="w-[420px] border-r flex flex-col h-full overflow-hidden">
                <StopProposalPanel selectedProposalId={selected?.id ?? null} onSelectProposal={setSelected} />
            </div>
            <div className="flex-1 relative h-full">
                <StopProposalMap proposal={selected} />
            </div>
        </div>
    )
}
