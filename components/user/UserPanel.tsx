"use client"

import { useState, useEffect } from "react"
import { useUserManageStore } from "@/store/user-store"
import { UserListPanel } from "./UserListPanel"
import { UserForm } from "./UserForm"
import { User } from "lucide-react"
import { getCurrentUserType } from "@/lib/utils"
import type { UserType } from "@/lib/types"

export function UserPanel() {
    const { editingUserId, setEditingUserId } = useUserManageStore()
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [loggedInType, setLoggedInType] = useState<UserType | null>(null)

    useEffect(() => {
        setLoggedInType(getCurrentUserType())
    }, [])

    // SUPER creates ORG accounts; everyone else creates SUB_ORG
    const newUserType: UserType = loggedInType === "SUPER" ? "ORG" : "SUB_ORG"

    const showForm = editingUserId !== null || isAddingNew
    const mode = isAddingNew ? "add" : "edit"

    const handleCloseForm = () => {
        setIsAddingNew(false)
        setEditingUserId(null)
    }

    return (
        <div className="flex h-full w-full bg-gray-50/50">
            {/* Left: User List */}
            <div className="w-1/3 min-w-[320px] bg-white border-r flex flex-col h-full shadow-sm z-10 transition-all">
                <UserListPanel
                    onAddNew={() => {
                        setEditingUserId(null)
                        setIsAddingNew(true)
                    }}
                    onEdit={(id) => {
                        setIsAddingNew(false)
                        setEditingUserId(id)
                    }}
                />
            </div>

            {/* Right: Form Area or Empty State */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col h-full">
                {showForm ? (
                    <div className="h-full w-full p-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        <UserForm
                            mode={mode}
                            defaultType={isAddingNew ? newUserType : undefined}
                            onClose={handleCloseForm}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <User className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm tracking-wide">Select a user to edit or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
