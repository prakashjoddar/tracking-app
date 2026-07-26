"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Check, Loader2, Map as MapIcon, RefreshCw, Save, Search } from "lucide-react"
import { toast } from "sonner"
import { fetchAllUsers, saveUser } from "@/lib/api"
import { getCurrentUserType } from "@/lib/utils"
import type { UserRequestResponse } from "@/lib/types"

type Draft = { mapProvider: "GOOGLE" | "MAPLIBRE"; placeSearchProvider: "GOOGLE" | "OSM" }

const draftOf = (org: UserRequestResponse): Draft => ({
    mapProvider: org.mapProvider ?? "GOOGLE",
    placeSearchProvider: org.placeSearchProvider ?? "GOOGLE",
})

export function MapSettingsPanel() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [orgs, setOrgs] = useState<UserRequestResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [drafts, setDrafts] = useState<Record<string, Draft>>({})
    const [savingId, setSavingId] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    // SUPER-only page — everyone else gets bounced to the dashboard, mirroring MenuAccessGuard's pattern.
    useEffect(() => {
        if (getCurrentUserType() !== "SUPER") {
            router.replace("/")
            return
        }
        setAuthorized(true)
    }, [router])

    const loadOrgs = async () => {
        try {
            setLoading(true)
            const all = await fetchAllUsers()
            const orgUsers = all.filter(u => u.type === "ORG")
            setOrgs(orgUsers)
            setDrafts(Object.fromEntries(orgUsers.map(o => [o.id!, draftOf(o)])))
        } catch (e) {
            console.error("Failed to load organisations:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (authorized) loadOrgs()
    }, [authorized])

    const filtered = orgs.filter(o => {
        const q = search.toLowerCase()
        return (
            (o.firstName || "").toLowerCase().includes(q) ||
            (o.lastName || "").toLowerCase().includes(q) ||
            (o.email || "").toLowerCase().includes(q) ||
            (o.username || "").toLowerCase().includes(q)
        )
    })

    const setDraft = (id: string, patch: Partial<Draft>) =>
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

    const isDirty = (org: UserRequestResponse) => {
        const d = drafts[org.id!]
        if (!d) return false
        const base = draftOf(org)
        return d.mapProvider !== base.mapProvider || d.placeSearchProvider !== base.placeSearchProvider
    }

    const handleSave = async (org: UserRequestResponse) => {
        const draft = drafts[org.id!]
        if (!draft) return
        try {
            setSavingId(org.id!)
            const saved = await saveUser({ ...org, ...draft })
            setOrgs(prev => prev.map(o => (o.id === org.id ? saved : o)))
            toast.success(`Updated map settings for ${org.firstName}.`)
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to save.")
        } finally {
            setSavingId(null)
        }
    }

    if (!authorized) return null

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-blue-600" />
                        Map Settings
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Choose the map renderer and place-search provider each organisation uses across the app.
                    </p>
                </div>
                <button
                    onClick={loadOrgs}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                </button>
            </div>

            {/* Search */}
            <div className="shrink-0 px-6 pt-4">
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm max-w-sm">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search organisations..."
                        className="text-sm bg-transparent outline-none w-full placeholder:text-slate-400 font-medium text-slate-700"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {loading && orgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading organisations...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Building2 size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No organisations found</p>
                    </div>
                ) : (
                    filtered.map(org => {
                        const draft = drafts[org.id!] ?? draftOf(org)
                        const dirty = isDirty(org)
                        return (
                            <div key={org.id} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                            <Building2 size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {org.firstName} {org.lastName}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{org.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSave(org)}
                                        disabled={!dirty || savingId === org.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {savingId === org.id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                        Save
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                                            <MapIcon size={13} /> Map Provider
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(["GOOGLE", "MAPLIBRE"] as const).map(opt => {
                                                const selected = draft.mapProvider === opt
                                                return (
                                                    <button
                                                        type="button"
                                                        key={opt}
                                                        onClick={() => setDraft(org.id!, { mapProvider: opt })}
                                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                                                    >
                                                        <span className="text-sm">{opt === "GOOGLE" ? "Google Maps" : "MapLibre"}</span>
                                                        {selected && <Check size={13} className="text-blue-600 shrink-0" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                                            <Search size={13} /> Place Search
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(["GOOGLE", "OSM"] as const).map(opt => {
                                                const selected = draft.placeSearchProvider === opt
                                                return (
                                                    <button
                                                        type="button"
                                                        key={opt}
                                                        onClick={() => setDraft(org.id!, { placeSearchProvider: opt })}
                                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                                                    >
                                                        <span className="text-sm">{opt === "GOOGLE" ? "Google Places" : "Free OSM Geocoder"}</span>
                                                        {selected && <Check size={13} className="text-blue-600 shrink-0" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
