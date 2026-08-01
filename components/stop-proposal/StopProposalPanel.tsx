"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchPendingStopProposals, approveStopProposal, rejectStopProposal } from "@/lib/api"
import { StopProposal } from "@/lib/types"
import { StopProposalCard } from "./StopProposalCard"
import { MapPin, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type StopProposalPanelProps = {
    /** Currently previewed request, if any — clicking a card selects it for the map preview beside this panel. */
    selectedProposalId: string | null
    onSelectProposal: (proposal: StopProposal) => void
}

export function StopProposalPanel({ selectedProposalId, onSelectProposal }: StopProposalPanelProps) {
    const [proposals, setProposals] = useState<StopProposal[]>([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            setProposals(await fetchPendingStopProposals())
        } catch (e) {
            console.error("Failed to fetch pending stop requests", e)
            toast.error("Failed to load stop requests")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    // Default to previewing the first request so the map isn't empty on first load, and fall back
    // to it whenever the previously selected one drops out of the list (approved/rejected/reloaded).
    useEffect(() => {
        if (proposals.length > 0 && !proposals.some((p) => p.id === selectedProposalId)) {
            onSelectProposal(proposals[0])
        }
    }, [proposals, selectedProposalId, onSelectProposal])

    const handleApprove = async (id: string, overrides: { finalSequence?: number; targetStopId?: string }, reviewNote: string) => {
        try {
            await approveStopProposal(id, { ...overrides, reviewNote: reviewNote || undefined })
            setProposals((prev) => prev.filter((p) => p.id !== id))
            toast.success("Request approved")
        } catch (e: any) {
            console.error("Failed to approve stop request", e)
            toast.error(e.response?.data?.message || "Failed to approve request")
        }
    }

    const handleReject = async (id: string, reviewNote: string) => {
        try {
            await rejectStopProposal(id, { reviewNote: reviewNote || undefined })
            setProposals((prev) => prev.filter((p) => p.id !== id))
            toast.success("Stop request rejected")
        } catch (e: any) {
            console.error("Failed to reject stop request", e)
            toast.error(e.response?.data?.message || "Failed to reject stop request")
        }
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-slate-100/60">
            <div className="shrink-0 px-6 pt-6 pb-5 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Stop Requests</h2>
                        <p className="text-xs text-slate-400">{proposals.length} pending review</p>
                    </div>
                </div>
                <button
                    onClick={load}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {loading && proposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading stop requests...</p>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <MapPin size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No stop requests pending review</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {proposals.map((proposal) => (
                            <StopProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                selected={proposal.id === selectedProposalId}
                                onSelect={() => onSelectProposal(proposal)}
                                onApprove={(overrides, reviewNote) => handleApprove(proposal.id, overrides, reviewNote)}
                                onReject={(reviewNote) => handleReject(proposal.id, reviewNote)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
