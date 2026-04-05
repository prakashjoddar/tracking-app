"use client"

import { UserRequestResponse } from "@/lib/types"
import { useUserManageStore } from "@/store/user-store"
import { CarFront, ShieldCheck, Phone, Mail, CreditCard, Tag, Pencil, Trash2, Loader2 } from "lucide-react"
import { deleteUser } from "@/lib/api"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type UserCardProps = {
    user: UserRequestResponse
    isEditing: boolean
    onEdit: () => void
}

export function UserCard({ user, isEditing, onEdit }: UserCardProps) {
    const { deleteUser: deleteUserStore } = useUserManageStore()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            setIsDeleting(true)
            if (user.id) {
                await deleteUser(user.id)
                deleteUserStore(user.id)
                toast.success("Deleted successfully")
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to delete")
        } finally {
            setIsDeleting(false)
        }
    }

    const isDriver = user.type === "DRIVER"

    const roleStyle = isDriver
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-indigo-100 text-indigo-700 border-indigo-200"

    return (
        <div className={cn(
            "rounded-xl border transition-all bg-white",
            isEditing ? "border-blue-500 shadow-sm ring-1 ring-blue-500/20" : "border-slate-200 hover:shadow-md hover:border-slate-300"
        )}>
            {/* Header + Details */}
            <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("p-2 rounded-lg border shrink-0", roleStyle)}>
                            {isDriver
                                ? <CarFront className="w-3.5 h-3.5 text-green-600" />
                                : <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.username}</p>
                        </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0", roleStyle)}>
                        {user.type}
                    </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{user.mobileNo || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate" title={user.email}>{user.email || "—"}</span>
                    </div>
                    {isDriver && user.licenseNo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-mono">{user.licenseNo}</span>
                        </div>
                    )}
                    {isDriver && user.licenseExpiryDate && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="text-[10px] text-slate-400 shrink-0">Exp:</span>
                            <span className="font-mono">{user.licenseExpiryDate}</span>
                        </div>
                    )}
                    {user.rfid && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{user.rfid}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 px-3.5 pb-3">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Delete
                </button>
                <button
                    onClick={onEdit}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border transition-colors ${
                        isEditing
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                    <Pencil size={11} />
                    {isEditing ? "Editing" : "Edit"}
                </button>
            </div>
        </div>
    )
}
