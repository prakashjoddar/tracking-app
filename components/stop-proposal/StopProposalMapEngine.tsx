"use client"

import { StopProposal } from "@/lib/types"
import { StopProposalMap } from "./StopProposalMap"
import { StopProposalMapGoogle } from "./StopProposalMapGoogle"

type Props = {
    proposal: StopProposal | null
    provider?: "google" | "maplibre"
}

/** Same provider switch as MapEngine, so the stop-request review map respects the current user's mapProvider setting. */
export function StopProposalMapEngine({ proposal, provider = "google" }: Props) {
    if (provider === "maplibre") {
        return <StopProposalMap proposal={proposal} />
    }
    return <StopProposalMapGoogle proposal={proposal} />
}
