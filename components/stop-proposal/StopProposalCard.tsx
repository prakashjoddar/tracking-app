"use client"

import { useState } from "react"
import { StopProposal, TripType } from "@/lib/types"
import { Bus, Check, MapPin, User, X, Loader2 } from "lucide-react"

const REQUESTER_BADGE: Record<string, string> = {
    DRIVER: "bg-orange-50 text-orange-700 border-orange-200",
    SUPERVISOR: "bg-blue-50 text-blue-700 border-blue-200",
    PARENT: "bg-purple-50 text-purple-700 border-purple-200",
    STUDENT: "bg-green-50 text-green-700 border-green-200",
    ORG: "bg-slate-100 text-slate-600 border-slate-200",
    SUB_ORG: "bg-slate-100 text-slate-600 border-slate-200",
    SUPER: "bg-slate-100 text-slate-600 border-slate-200",
}

const TRIP_TYPE_LABEL: Record<TripType, string> = { PICKING: "Pickup", DROPPING: "Drop" }

/** Trip name/type/timing, so an admin can tell requests apart without cross-referencing the trip list. */
function tripSummary(proposal: StopProposal): string | null {
    const parts = [
        proposal.tripName,
        proposal.tripType ? TRIP_TYPE_LABEL[proposal.tripType] : null,
        proposal.tripStartTime && proposal.tripEndTime ? `${proposal.tripStartTime}–${proposal.tripEndTime}` : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : null
}

type StopProposalCardProps = {
    proposal: StopProposal
    onApprove: (finalSequence: number, reviewNote: string) => Promise<void>
    onReject: (reviewNote: string) => Promise<void>
}

export function StopProposalCard({ proposal, onApprove, onReject }: StopProposalCardProps) {
    const [finalSequence, setFinalSequence] = useState(String(proposal.requestedSequence))
    const [reviewNote, setReviewNote] = useState("")
    const [busy, setBusy] = useState<"approve" | "reject" | null>(null)

    const handleApprove = async () => {
        const parsed = parseInt(finalSequence, 10)
        if (!Number.isFinite(parsed) || parsed < 1) return
        setBusy("approve")
        try {
            await onApprove(parsed, reviewNote.trim())
        } finally {
            setBusy(null)
        }
    }

    const handleReject = async () => {
        setBusy("reject")
        try {
            await onReject(reviewNote.trim())
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className="border rounded-xl p-4 shadow-sm bg-white">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Bus size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{proposal.stopName || `Vehicle ${proposal.vehicleNo}`}</p>
                        <p className="text-xs text-gray-500 truncate">{proposal.vehicleNo}</p>
                        {tripSummary(proposal) && <p className="text-xs text-blue-600 truncate">{tripSummary(proposal)}</p>}
                    </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${REQUESTER_BADGE[proposal.requestedByUserType] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {proposal.requestedByUserType}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    Requested position #{proposal.requestedSequence}
                </span>
                {proposal.studentIds.length > 0 && (
                    <span className="flex items-center gap-1">
                        <User size={11} />
                        {proposal.studentIds.length === 1 ? "1 student" : `${proposal.studentIds.length} students`}
                    </span>
                )}
                <span>{new Date(proposal.createdAt).toLocaleString()}</span>
            </div>

            {proposal.latitude != null && proposal.longitude != null && (
                <p className="mt-1 text-xs text-gray-400 font-mono">
                    {proposal.latitude.toFixed(5)}, {proposal.longitude.toFixed(5)}
                </p>
            )}

            <div className="mt-3 flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">
                    Insert at
                </label>
                <input
                    type="number"
                    min={1}
                    value={finalSequence}
                    onChange={(e) => setFinalSequence(e.target.value)}
                    className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
                />
            </div>

            <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                placeholder="Optional note for the requester..."
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300"
            />

            <div className="mt-3 flex gap-2">
                <button
                    onClick={handleReject}
                    disabled={busy !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {busy === "reject" ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                    Reject
                </button>
                <button
                    onClick={handleApprove}
                    disabled={busy !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {busy === "approve" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Approve
                </button>
            </div>
        </div>
    )
}
