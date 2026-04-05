"use client"

import { useEffect, useState } from "react"
import { fetchCurrentUser, saveUser, updatePassword } from "@/lib/api"
import { UserRequestResponse } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    User, Mail, Phone, MapPin, Lock, Save, Loader2,
    Eye, EyeOff, ShieldCheck, KeyRound,
} from "lucide-react"

type FieldProps = { label: string; required?: boolean; children: React.ReactNode }
const Field = ({ label, required, children }: FieldProps) => (
    <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
)

type SectionHeaderProps = { icon: React.ReactNode; title: string; description?: string }
const SectionHeader = ({ icon, title, description }: SectionHeaderProps) => (
    <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</span>
            {title}
        </h3>
        {description && <p className="text-xs text-slate-500 mt-1 ml-8">{description}</p>}
    </div>
)

const typeColors: Record<string, string> = {
    SUPER: "bg-red-100 text-red-700",
    ORG: "bg-blue-100 text-blue-700",
    SUB_ORG: "bg-purple-100 text-purple-700",
    DRIVER: "bg-green-100 text-green-700",
    SUPERVISOR: "bg-orange-100 text-orange-700",
}

const typeLabels: Record<string, string> = {
    SUPER: "Super Admin",
    ORG: "Organisation",
    SUB_ORG: "Sub-Organisation",
    DRIVER: "Driver",
    SUPERVISOR: "Supervisor",
    STUDENT: "Student",
    PARENT: "Parent",
}

export function ProfilePanel() {
    const [user, setUser] = useState<UserRequestResponse | null>(null)
    const [form, setForm] = useState<Partial<UserRequestResponse>>({})
    const [savingDetails, setSavingDetails] = useState(false)
    const [loading, setLoading] = useState(true)

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)

    useEffect(() => {
        fetchCurrentUser()
            .then(data => {
                setUser(data)
                setForm({
                    id: data.id,
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    mobileNo: data.mobileNo || "",
                    username: data.username || "",
                    address: data.address || "",
                    type: data.type,
                })
            })
            .catch(() => toast.error("Failed to load profile."))
            .finally(() => setLoading(false))
    }, [])

    const set = <K extends keyof UserRequestResponse>(key: K, value: UserRequestResponse[K]) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleSaveDetails = async () => {
        if (!form.firstName?.trim()) { toast.error("First name is required."); return }
        if (!form.email?.trim()) { toast.error("Email is required."); return }
        if (!form.username?.trim()) { toast.error("Username is required."); return }
        try {
            setSavingDetails(true)
            const saved = await saveUser(form as UserRequestResponse)
            setUser(saved)
            toast.success("Profile updated successfully.")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to update profile.")
        } finally {
            setSavingDetails(false)
        }
    }

    const handleChangePassword = async () => {
        if (!newPassword.trim()) { toast.error("New password is required."); return }
        if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return }
        if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return }
        try {
            setSavingPassword(true)
            await updatePassword(newPassword)
            toast.success("Password changed successfully.")
            setNewPassword("")
            setConfirmPassword("")
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to change password.")
        } finally {
            setSavingPassword(false)
        }
    }

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        : "?"

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Loading profile...</span>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50/50">
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

                {/* Avatar + Name header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white text-xl font-bold shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-slate-900 truncate">
                            {user ? `${user.firstName} ${user.lastName}`.trim() : "—"}
                        </h1>
                        <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                        {user?.type && (
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${typeColors[user.type] ?? "bg-gray-100 text-gray-600"}`}>
                                {typeLabels[user.type] ?? user.type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Update Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <SectionHeader
                        icon={<User className="w-4 h-4" />}
                        title="Profile Details"
                        description="Update your personal and contact information."
                    />

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="First Name" required>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        value={form.firstName || ""}
                                        onChange={e => set("firstName", e.target.value)}
                                        className="pl-9"
                                        placeholder="John"
                                    />
                                </div>
                            </Field>
                            <Field label="Last Name">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        value={form.lastName || ""}
                                        onChange={e => set("lastName", e.target.value)}
                                        className="pl-9"
                                        placeholder="Doe"
                                    />
                                </div>
                            </Field>
                        </div>

                        <Field label="Email" required>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    type="email"
                                    value={form.email || ""}
                                    onChange={e => set("email", e.target.value)}
                                    className="pl-9"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Mobile Number">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        value={form.mobileNo || ""}
                                        onChange={e => set("mobileNo", e.target.value)}
                                        className="pl-9"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </Field>
                            <Field label="Username" required>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        value={form.username || ""}
                                        onChange={e => set("username", e.target.value)}
                                        className="pl-9"
                                        placeholder="john_org"
                                    />
                                </div>
                            </Field>
                        </div>

                        <Field label="Address">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    value={form.address || ""}
                                    onChange={e => set("address", e.target.value)}
                                    className="pl-9"
                                    placeholder="123 Main St, City"
                                />
                            </div>
                        </Field>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            onClick={handleSaveDetails}
                            disabled={savingDetails}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70"
                        >
                            {savingDetails ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingDetails ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <SectionHeader
                        icon={<KeyRound className="w-4 h-4" />}
                        title="Change Password"
                        description="Set a new password for your account."
                    />

                    <div className="space-y-4">
                        <Field label="New Password" required>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="pl-9 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Confirm Password" required>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="pl-9 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            onClick={handleChangePassword}
                            disabled={savingPassword}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 shadow-sm active:scale-[0.98] transition-all disabled:opacity-70"
                        >
                            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                            {savingPassword ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
