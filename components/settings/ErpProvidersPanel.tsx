"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Copy, KeyRound, Link2, Loader2, Plus, RefreshCw, Server, Unlink } from "lucide-react"
import { toast } from "sonner"
import {
    createErpAccount,
    fetchAllUsers,
    fetchErpAccounts,
    fetchErpLinkedOrgs,
    linkErpOrg,
    rotateErpKey,
    unlinkErpOrg,
    updateErpWebhook,
} from "@/lib/api"
import { getCurrentUserType } from "@/lib/utils"
import type { ErpAccountRequest, ErpAccountResponse, ErpOrgResponse, UserRequestResponse } from "@/lib/types"

const emptyDraft: ErpAccountRequest = {
    firstName: "", lastName: "", orgName: "", email: "", mobileNo: "", username: "", password: "", webhookUrl: "",
}

export function ErpProvidersPanel() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [accounts, setAccounts] = useState<ErpAccountResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [draft, setDraft] = useState<ErpAccountRequest>(emptyDraft)
    const [creating, setCreating] = useState(false)
    const [busyId, setBusyId] = useState<number | null>(null)
    const [webhookDrafts, setWebhookDrafts] = useState<Record<number, string>>({})
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [linkedOrgs, setLinkedOrgs] = useState<ErpOrgResponse[]>([])
    const [allOrgs, setAllOrgs] = useState<UserRequestResponse[]>([])
    const [selectedOrgToLink, setSelectedOrgToLink] = useState<string>("")
    const [linking, setLinking] = useState(false)

    useEffect(() => {
        if (getCurrentUserType() !== "SUPER") {
            router.replace("/")
            return
        }
        setAuthorized(true)
    }, [router])

    const load = async () => {
        try {
            setLoading(true)
            const all = await fetchErpAccounts()
            setAccounts(all)
            setWebhookDrafts(Object.fromEntries(all.map(a => [a.id, a.webhookUrl ?? ""])))
        } catch (e) {
            console.error("Failed to load ERP accounts:", e)
            toast.error("Failed to load ERP accounts.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (authorized) load()
    }, [authorized])

    useEffect(() => {
        if (!authorized) return
        fetchAllUsers()
            .then(all => setAllOrgs(all.filter(u => u.type === "ORG")))
            .catch(e => console.error("Failed to load orgs:", e))
    }, [authorized])

    const handleCreate = async () => {
        if (!draft.firstName || !draft.lastName || !draft.email || !draft.password) {
            toast.error("First name, last name, email and password are required.")
            return
        }
        try {
            setCreating(true)
            const created = await createErpAccount(draft)
            setAccounts(prev => [...prev, created])
            setWebhookDrafts(prev => ({ ...prev, [created.id]: created.webhookUrl ?? "" }))
            setDraft(emptyDraft)
            setShowCreate(false)
            toast.success(`Created ERP account "${created.firstName} ${created.lastName}".`)
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to create ERP account.")
        } finally {
            setCreating(false)
        }
    }

    const handleRotate = async (account: ErpAccountResponse) => {
        if (!confirm(`Rotate the publicKey for "${account.firstName} ${account.lastName}"? Their current key stops working immediately.`)) return
        try {
            setBusyId(account.id)
            const updated = await rotateErpKey(account.id)
            setAccounts(prev => prev.map(a => (a.id === account.id ? updated : a)))
            toast.success("Key rotated — share the new publicKey with the ERP provider.")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to rotate key.")
        } finally {
            setBusyId(null)
        }
    }

    const handleSaveWebhook = async (account: ErpAccountResponse) => {
        const webhookUrl = webhookDrafts[account.id] ?? ""
        try {
            setBusyId(account.id)
            const updated = await updateErpWebhook(account.id, webhookUrl)
            setAccounts(prev => prev.map(a => (a.id === account.id ? updated : a)))
            toast.success("Webhook URL saved.")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to save webhook URL.")
        } finally {
            setBusyId(null)
        }
    }

    const handleCopyKey = (key: string | null) => {
        if (!key) return
        navigator.clipboard.writeText(key)
        toast.success("publicKey copied to clipboard.")
    }

    const handleToggleOrgs = async (account: ErpAccountResponse) => {
        if (expandedId === account.id) {
            setExpandedId(null)
            return
        }
        try {
            const orgs = await fetchErpLinkedOrgs(account.id)
            setLinkedOrgs(orgs)
            setSelectedOrgToLink("")
            setExpandedId(account.id)
        } catch (e) {
            console.error("Failed to load linked orgs:", e)
            toast.error("Failed to load linked orgs.")
        }
    }

    const handleLinkOrg = async (account: ErpAccountResponse) => {
        if (!selectedOrgToLink) return
        try {
            setLinking(true)
            await linkErpOrg(account.id, Number(selectedOrgToLink))
            const orgs = await fetchErpLinkedOrgs(account.id)
            setLinkedOrgs(orgs)
            setSelectedOrgToLink("")
            toast.success("Org linked.")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to link org.")
        } finally {
            setLinking(false)
        }
    }

    const handleUnlinkOrg = async (account: ErpAccountResponse, org: ErpOrgResponse) => {
        try {
            await unlinkErpOrg(account.id, org.id)
            setLinkedOrgs(prev => prev.filter(o => o.id !== org.id))
            toast.success("Org unlinked.")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to unlink org.")
        }
    }

    const handleCopyOrgKey = (orgKey: string) => {
        navigator.clipboard.writeText(orgKey)
        toast.success("orgKey copied to clipboard.")
    }

    if (!authorized) return null

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Server className="w-5 h-5 text-blue-600" />
                        ERP Providers
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Accounts that manage their own org accounts via the /erp/** API — bulk uploads, reports, and alert webhooks.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreate(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                        <Plus size={15} /> New ERP account
                    </button>
                    <button
                        onClick={load}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                    </button>
                </div>
            </div>

            {showCreate && (
                <div className="shrink-0 mx-6 mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 grid grid-cols-2 gap-3">
                    <input placeholder="Organization name (e.g. Acme ERP Systems)" value={draft.orgName}
                        onChange={e => setDraft(d => ({ ...d, orgName: e.target.value }))}
                        className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Contact first name" value={draft.firstName}
                        onChange={e => setDraft(d => ({ ...d, firstName: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Contact last name" value={draft.lastName}
                        onChange={e => setDraft(d => ({ ...d, lastName: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Email" value={draft.email}
                        onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Mobile no. (optional)" value={draft.mobileNo}
                        onChange={e => setDraft(d => ({ ...d, mobileNo: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Username (defaults to email)" value={draft.username}
                        onChange={e => setDraft(d => ({ ...d, username: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Password" type="password" value={draft.password}
                        onChange={e => setDraft(d => ({ ...d, password: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input placeholder="Webhook URL (optional)" value={draft.webhookUrl}
                        onChange={e => setDraft(d => ({ ...d, webhookUrl: e.target.value }))}
                        className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                    <div className="col-span-2 flex justify-end gap-2">
                        <button onClick={() => { setShowCreate(false); setDraft(emptyDraft) }}
                            className="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100">
                            Cancel
                        </button>
                        <button onClick={handleCreate} disabled={creating}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40">
                            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                            Create
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {loading && accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading ERP accounts...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Server size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No ERP accounts yet</p>
                    </div>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                            {account.orgName || `${account.firstName} ${account.lastName}`}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {account.orgName ? `${account.firstName} ${account.lastName} · ` : ""}{account.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleOrgs(account)}
                                    className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                                >
                                    {expandedId === account.id ? "Hide linked orgs" : "View linked orgs"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                                        <KeyRound size={13} /> publicKey
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs truncate">
                                            {account.publicKey ?? "—"}
                                        </code>
                                        <button onClick={() => handleCopyKey(account.publicKey)}
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Copy">
                                            <Copy size={14} />
                                        </button>
                                        <button onClick={() => handleRotate(account)} disabled={busyId === account.id}
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" title="Rotate key">
                                            {busyId === account.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Alert webhook URL</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={webhookDrafts[account.id] ?? ""}
                                            onChange={e => setWebhookDrafts(prev => ({ ...prev, [account.id]: e.target.value }))}
                                            placeholder="https://..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                        />
                                        <button onClick={() => handleSaveWebhook(account)} disabled={busyId === account.id}
                                            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-40">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {expandedId === account.id && (
                                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                    {linkedOrgs.length === 0 ? (
                                        <p className="text-xs text-slate-400">No orgs linked yet.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {linkedOrgs.map(org => (
                                                <div key={org.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700">
                                                    <span className="truncate">{org.orgName || `${org.firstName} ${org.lastName}`}</span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <code className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-500">
                                                            {org.orgKey.slice(0, 8)}…
                                                        </code>
                                                        <button onClick={() => handleCopyOrgKey(org.orgKey)} title="Copy orgKey"
                                                            className="p-1 rounded hover:bg-slate-200 text-slate-500">
                                                            <Copy size={12} />
                                                        </button>
                                                        <button onClick={() => handleUnlinkOrg(account, org)} title="Unlink"
                                                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-red-600">
                                                            <Unlink size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedOrgToLink}
                                            onChange={e => setSelectedOrgToLink(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                                        >
                                            <option value="">Link an existing org...</option>
                                            {allOrgs
                                                .filter(org => !linkedOrgs.some(l => String(l.id) === org.id))
                                                .map(org => (
                                                    <option key={org.id} value={org.id}>
                                                        {org.orgName || `${org.firstName} ${org.lastName}`} (#{org.id})
                                                    </option>
                                                ))}
                                        </select>
                                        <button onClick={() => handleLinkOrg(account)} disabled={!selectedOrgToLink || linking}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-40">
                                            {linking ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                                            Link
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
