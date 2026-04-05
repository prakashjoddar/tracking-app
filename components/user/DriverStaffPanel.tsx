"use client"

import { useEffect, useState } from "react"
import { useUserManageStore } from "@/store/user-store"
import { UserCard } from "./UserCard"
import { UserForm } from "./UserForm"
import { fetchUsers, fetchAllUsers } from "@/lib/api"
import { UserType } from "@/lib/types"
import { getCurrentUserType } from "@/lib/utils"
import { Search, Plus, RefreshCw, CarFront, ShieldCheck } from "lucide-react"

type Tab = "DRIVER" | "SUPERVISOR"

export function DriverStaffPanel() {
    const [tab, setTab] = useState<Tab>("DRIVER")
    const [search, setSearch] = useState("")
    const [isAddingNew, setIsAddingNew] = useState(false)

    const { users, setUsers, loading, setLoading, editingUserId, setEditingUserId } = useUserManageStore()

    const loadUsers = async (type: UserType) => {
        try {
            setLoading(true)
            const loginType = getCurrentUserType()
            // SUPER: fetch all users (tab filter applied client-side via .filter(u => u.type === tab))
            // ORG / SUB_ORG: fetch with type param so backend scopes to their org
            const data = loginType === "SUPER"
                ? await fetchAllUsers()
                : await fetchUsers(type)
            if (Array.isArray(data)) setUsers(data)
            else setUsers([])
        } catch (e) {
            console.error("Failed to fetch users:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setIsAddingNew(false)
        setEditingUserId(null)
        setSearch("")
        loadUsers(tab)
    }, [tab])

    const handleAddNew = () => {
        setEditingUserId(null)
        setIsAddingNew(true)
    }

    const handleEdit = (id: string) => {
        setIsAddingNew(false)
        setEditingUserId(id)
    }

    const handleCloseForm = () => {
        setIsAddingNew(false)
        setEditingUserId(null)
    }

    const showForm = isAddingNew || editingUserId !== null
    const mode = isAddingNew ? "add" : "edit"

    const filtered = users
        .filter(u => u.type === tab)
        .filter(u => {
            const q = search.toLowerCase()
            return (
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.username || "").toLowerCase().includes(q) ||
                (u.mobileNo || "").toLowerCase().includes(q) ||
                (u.licenseNo || "").toLowerCase().includes(q) ||
                (u.rfid || "").toLowerCase().includes(q)
            )
        })

    return (
        <div className="flex h-full w-full bg-gray-50/50">
            {/* Left panel */}
            <div className="w-1/3 min-w-[320px] bg-white border-r flex flex-col h-full shadow-sm z-10">

                <div className="shrink-0 px-5 pt-5 pb-0 border-b border-slate-200 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                            Driver & Supervisor
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadUsers(tab)}
                                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
                                title="Refresh"
                            >
                                <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
                            </button>
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                <Plus size={15} />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                        {(["DRIVER", "SUPERVISOR"] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    tab === t
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {t === "DRIVER"
                                    ? <CarFront size={13} />
                                    : <ShieldCheck size={13} />
                                }
                                {t === "DRIVER" ? "Drivers" : "Supervisors"}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    tab === t ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                                }`}>
                                    {users.filter(u => u.type === t).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all mb-4">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${tab === "DRIVER" ? "drivers" : "supervisors"}...`}
                            className="text-sm bg-transparent outline-none w-full placeholder:text-slate-400 text-slate-700"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                            <RefreshCw size={22} className="animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Loading...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            {tab === "DRIVER" ? <CarFront size={24} /> : <ShieldCheck size={24} />}
                            <p className="text-sm font-medium">No {tab === "DRIVER" ? "drivers" : "supervisors"} found</p>
                        </div>
                    ) : (
                        filtered.map(user => (
                            <UserCard
                                key={user.id}
                                user={user}
                                isEditing={editingUserId === user.id}
                                onEdit={() => handleEdit(user.id!)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
                {showForm ? (
                    <div className="h-full w-full p-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        <UserForm
                            mode={mode}
                            defaultType={tab}
                            onClose={handleCloseForm}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            {tab === "DRIVER"
                                ? <CarFront className="w-8 h-8 text-slate-300" />
                                : <ShieldCheck className="w-8 h-8 text-slate-300" />
                            }
                        </div>
                        <p className="text-sm tracking-wide">
                            Select a {tab === "DRIVER" ? "driver" : "supervisor"} to edit, or add a new one.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
