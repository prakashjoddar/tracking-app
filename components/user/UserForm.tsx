"use client"

import { useEffect, useState } from "react"
import { UserRequestResponse, UserType } from "@/lib/types"
import { useUserManageStore } from "@/store/user-store"
import { Input } from "@/components/ui/input"
import { Save, User, Mail, Lock, X, Loader2, Eye, EyeOff, CreditCard, ShieldCheck } from "lucide-react"
import { saveUser } from "@/lib/api"
import { toast } from "sonner"

type Mode = "add" | "edit"

type UserFormProps = {
    mode: Mode
    defaultType?: UserType
    onClose: () => void
}

const makeDefault = (type: UserType): UserRequestResponse => ({
    firstName: "",
    lastName: "",
    email: "",
    mobileNo: "",
    username: "",
    password: "",
    type,
    address: "",
    licenseNo: "",
    licenseExpiryDate: "",
    rfid: "",
})

// ── outside component — stable references, no remount on re-render ────────────

type FieldProps = { label: string; required?: boolean; error?: string; children: React.ReactNode }
const Field = ({ label, required, error, children }: FieldProps) => (
    <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
)

type SectionHeaderProps = { icon: React.ReactNode; title: string }
const SectionHeader = ({ icon, title }: SectionHeaderProps) => (
    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-2 flex items-center gap-2 mb-4">
        {icon}
        {title}
    </h3>
)

// ─────────────────────────────────────────────────────────────────────────────

export function UserForm({ mode, defaultType = "DRIVER", onClose }: UserFormProps) {
    const { users, editingUserId, addUser, updateUser } = useUserManageStore()

    const [form, setForm] = useState<UserRequestResponse>(makeDefault(defaultType))
    const [saving, setSaving] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof UserRequestResponse, string>>>({})

    useEffect(() => {
        if (mode === "edit" && editingUserId) {
            const current = users.find(u => u.id === editingUserId)
            if (current) {
                setForm({
                    id: current.id,
                    firstName: current.firstName || "",
                    lastName: current.lastName || "",
                    email: current.email || "",
                    mobileNo: current.mobileNo || "",
                    username: current.username || "",
                    password: current.password || "",
                    type: current.type,
                    address: current.address || "",
                    licenseNo: current.licenseNo || "",
                    licenseExpiryDate: current.licenseExpiryDate || "",
                    rfid: current.rfid || "",
                })
            }
        } else {
            setForm(makeDefault(defaultType))
        }
        setErrors({})
    }, [mode, editingUserId])

    const set = <K extends keyof UserRequestResponse>(key: K, value: UserRequestResponse[K]) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const validate = () => {
        const e: Partial<Record<keyof UserRequestResponse, string>> = {}
        if (!form.firstName.trim()) e.firstName = "Required"
        if (!form.email.trim()) e.email = "Required"
        if (!form.username.trim()) e.username = "Required"
        if (mode === "add" && !form.password?.trim()) e.password = "Required for new users"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async (): Promise<void> => {
        if (!validate()) return
        try {
            setSaving(true)
            const payload = { ...form }
            if (!payload.licenseNo) delete payload.licenseNo
            if (!payload.licenseExpiryDate) delete payload.licenseExpiryDate
            if (!payload.rfid) delete payload.rfid
            const saved = await saveUser(payload)
            if (mode === "edit" && editingUserId) {
                updateUser(editingUserId, saved)
            } else {
                addUser(saved)
            }
            toast.success("User saved successfully.")
            onClose()
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Failed to save.")
        } finally {
            setSaving(false)
        }
    }

    const isDriver = form.type === "DRIVER"
    const typeLabel: Record<UserType, string> = {
        SUPER: "Super Admin", ORG: "Organisation", SUB_ORG: "Sub-Organisation",
        DRIVER: "Driver", SUPERVISOR: "Supervisor", STUDENT: "Student", PARENT: "Parent",
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {mode === "add" ? `Add ${typeLabel[form.type] ?? form.type}` : `Edit ${typeLabel[form.type] ?? form.type}`}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {mode === "add" ? "Fill in the details below." : `Editing — ${form.firstName} ${form.lastName}`}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {/* Personal */}
                <div>
                    <SectionHeader icon={<User className="w-4 h-4" />} title="Personal Information" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="First Name" required error={errors.firstName}>
                            <Input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                                className={errors.firstName ? "border-red-500" : ""} placeholder="John" />
                        </Field>
                        <Field label="Last Name">
                            <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Doe" />
                        </Field>
                        <div className="col-span-2">
                            <Field label="Address">
                                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, City" />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <SectionHeader icon={<Mail className="w-4 h-4" />} title="Contact" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Email" required error={errors.email}>
                            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                                className={errors.email ? "border-red-500" : ""} placeholder="john@example.com" />
                        </Field>
                        <Field label="Mobile Number">
                            <Input value={form.mobileNo} onChange={e => set("mobileNo", e.target.value)} placeholder="+91 98765 43210" />
                        </Field>
                    </div>
                </div>

                {/* Driver-specific */}
                {isDriver && (
                    <div>
                        <SectionHeader icon={<CreditCard className="w-4 h-4" />} title="Driver Details" />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="License Number">
                                <Input value={form.licenseNo || ""} onChange={e => set("licenseNo", e.target.value)} placeholder="TS08 2021 123456" />
                            </Field>
                            <Field label="License Expiry">
                                <Input type="date" value={form.licenseExpiryDate || ""} onChange={e => set("licenseExpiryDate", e.target.value)} />
                            </Field>
                            <Field label="RFID Tag">
                                <Input value={form.rfid || ""} onChange={e => set("rfid", e.target.value)} placeholder="RFID-0001" />
                            </Field>
                        </div>
                    </div>
                )}

                {/* Supervisor-specific */}
                {!isDriver && (
                    <div>
                        <SectionHeader icon={<ShieldCheck className="w-4 h-4" />} title="Supervisor Details" />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="RFID Tag">
                                <Input value={form.rfid || ""} onChange={e => set("rfid", e.target.value)} placeholder="RFID-0001" />
                            </Field>
                        </div>
                    </div>
                )}

                {/* Account */}
                <div>
                    <SectionHeader icon={<Lock className="w-4 h-4" />} title="Account" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Username" required error={errors.username}>
                            <Input value={form.username} onChange={e => set("username", e.target.value)}
                                className={errors.username ? "border-red-500" : ""} placeholder="john_drv" />
                        </Field>
                        <Field label="Password" required={mode === "add"} error={errors.password}>
                            <div className="relative">
                                <Input type={showPassword ? "text" : "password"} value={form.password || ""}
                                    onChange={e => set("password", e.target.value)}
                                    className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                                    placeholder={mode === "edit" ? "Leave blank to keep" : "••••••••"} />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    )
}
