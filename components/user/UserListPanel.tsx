"use client"

import { useEffect, useState } from "react"
import { useUserManageStore } from "@/store/user-store"
import { UserCard } from "./UserCard"
import { Search, Plus, RefreshCw, Users } from "lucide-react"
import { fetchUsers, fetchAllUsers } from "@/lib/api"
import { getCurrentUserType } from "@/lib/utils"

type UserListPanelProps = {
    onAddNew: () => void
    onEdit: (id: string) => void
}

export function UserListPanel({ onAddNew, onEdit }: UserListPanelProps) {
    const [search, setSearch] = useState<string>("")
    const { users, editingUserId, setUsers, setLoading, loading } = useUserManageStore()

    const loadUsers = async () => {
        try {
            setLoading(true)
            const userType = getCurrentUserType()
            const data = userType === "SUPER"
                ? await fetchAllUsers()
                : await fetchUsers("SUB_ORG")
            if (Array.isArray(data)) {
                setUsers(data)
            } else {
                setUsers([])
            }
        } catch (e) {
            console.error("Failed to fetch users:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const filtered = users.filter((u) => {
        const query = search.toLowerCase()
        return (
            (u.firstName || "").toLowerCase().includes(query) ||
            (u.lastName || "").toLowerCase().includes(query) ||
            (u.email || "").toLowerCase().includes(query) ||
            (u.username || "").toLowerCase().includes(query) ||
            (u.type || "").toLowerCase().includes(query)
        )
    })

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Users Directory
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">{users.length} registered</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadUsers}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                            title="Refresh List"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
                        </button>
                        <button
                            onClick={onAddNew}
                            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all"
                        >
                            <Plus size={16} />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="text-sm bg-transparent outline-none w-full placeholder:text-slate-400 font-medium text-slate-700"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loading && users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p className="text-sm font-medium">Loading directory...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Users size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No users found</p>
                    </div>
                ) : (
                    filtered.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            isEditing={editingUserId === user.id}
                            onEdit={() => onEdit(user.id!)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
