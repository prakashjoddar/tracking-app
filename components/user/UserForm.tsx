"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { UserRequestResponse, UserType, VehicleGroupEntry } from "@/lib/types"
import { useUserManageStore } from "@/store/user-store"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { Input } from "@/components/ui/input"
import { Save, User, Mail, Lock, X, Loader2, Eye, EyeOff, CreditCard, ShieldCheck, Camera, Car, Layers, Check, Bus, ListChecks } from "lucide-react"
import { saveUser, uploadUserPhoto, resolveUserPhotoUrl, fetchVehicleGroups } from "@/lib/api"
import { MENU_ITEMS } from "@/lib/menu-items"
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
    vehicleIds: [],
    vehicleGroupIds: [],
    allowedMenus: [],
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

    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isSubOrg = form.type === "SUB_ORG"
    const { vehicles, fetchVehicles } = useVehicleManageStore()
    const [groups, setGroups] = useState<VehicleGroupEntry[]>([])
    useEffect(() => {
        if (!isSubOrg) return
        if (vehicles.length === 0) fetchVehicles()
        fetchVehicleGroups().then(setGroups).catch(() => {})
    }, [isSubOrg])

    const toggleVehicleId = (id: string) => {
        setForm(prev => ({
            ...prev,
            vehicleIds: (prev.vehicleIds ?? []).includes(id)
                ? (prev.vehicleIds ?? []).filter(v => v !== id)
                : [...(prev.vehicleIds ?? []), id],
        }))
    }

    const toggleGroupId = (id: string) => {
        setForm(prev => ({
            ...prev,
            vehicleGroupIds: (prev.vehicleGroupIds ?? []).includes(id)
                ? (prev.vehicleGroupIds ?? []).filter(v => v !== id)
                : [...(prev.vehicleGroupIds ?? []), id],
        }))
    }

    const restrictableMenus = MENU_ITEMS.filter(m => m.menuKey !== "DASHBOARD")
    const toggleMenuKey = (key: string) => {
        setForm(prev => ({
            ...prev,
            allowedMenus: (prev.allowedMenus ?? []).includes(key)
                ? (prev.allowedMenus ?? []).filter(v => v !== key)
                : [...(prev.allowedMenus ?? []), key],
        }))
    }

    const assignedVehicleCount = useMemo(() => {
        const groupVehicleNos = new Set<string>()
        for (const g of groups) {
            if ((form.vehicleGroupIds ?? []).includes(g.id)) {
                g.vehicleNumbers.forEach(no => groupVehicleNos.add(no))
            }
        }
        for (const v of vehicles) {
            if ((form.vehicleIds ?? []).includes(v.id)) groupVehicleNos.add(v.number)
        }
        return groupVehicleNos.size
    }, [groups, vehicles, form.vehicleGroupIds, form.vehicleIds])

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
                    photoUrl: current.photoUrl,
                    vehicleIds: current.vehicleIds || [],
                    vehicleGroupIds: current.vehicleGroupIds || [],
                    allowedMenus: current.allowedMenus || [],
                })
                setPhotoPreview(resolveUserPhotoUrl(current.photoUrl))
            }
        } else {
            setForm(makeDefault(defaultType))
            setPhotoPreview(null)
        }
        setPhotoFile(null)
        setErrors({})
    }, [mode, editingUserId])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.")
            return
        }
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

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
            let saved = await saveUser(payload)
            if (photoFile && saved.id) {
                saved = await uploadUserPhoto(saved.id, photoFile)
            }
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

                {/* Photo */}
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div className="size-20 rounded-2xl overflow-hidden bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">
                            {photoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "?"
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 flex items-center justify-center size-7 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors ring-2 ring-white"
                            title="Upload photo"
                        >
                            <Camera size={13} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Profile Photo</p>
                        <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, up to 5MB.</p>
                    </div>
                </div>

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

                {/* Vehicle Access — SUB_ORG only */}
                {isSubOrg && (
                    <div>
                        <SectionHeader icon={<Car className="w-4 h-4" />} title="Vehicle Access" />
                        <p className="text-xs text-slate-400 -mt-2 mb-3">
                            {(form.vehicleIds?.length || form.vehicleGroupIds?.length)
                                ? `Restricted to ${assignedVehicleCount} vehicle${assignedVehicleCount === 1 ? "" : "s"}.`
                                : "No restriction — this sub-login sees every vehicle in your organisation."}
                        </p>

                        <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Layers size={13} /> Vehicle Groups</p>
                            {groups.length === 0 ? (
                                <p className="text-xs text-slate-400">No vehicle groups created yet.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {groups.map(g => {
                                        const selected = (form.vehicleGroupIds ?? []).includes(g.id)
                                        return (
                                            <button type="button" key={g.id} onClick={() => toggleGroupId(g.id)}
                                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                                                <span className="text-sm truncate">{g.name}</span>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <span className="text-[10px] text-slate-400">{g.vehicleNumbers.length}</span>
                                                    {selected && <Check size={13} className="text-blue-600" />}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Bus size={13} /> Individual Vehicles</p>
                            {vehicles.length === 0 ? (
                                <p className="text-xs text-slate-400">No vehicles found.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {vehicles.map(v => {
                                        const selected = (form.vehicleIds ?? []).includes(v.id)
                                        return (
                                            <button type="button" key={v.id} onClick={() => toggleVehicleId(v.id)}
                                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                                                <span className="text-sm truncate">{v.number}</span>
                                                {selected && <Check size={13} className="text-blue-600 shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Menu Access — SUB_ORG only */}
                {isSubOrg && (
                    <div>
                        <SectionHeader icon={<ListChecks className="w-4 h-4" />} title="Menu Access" />
                        <p className="text-xs text-slate-400 -mt-2 mb-3">
                            {form.allowedMenus?.length
                                ? `Restricted to ${form.allowedMenus.length} menu${form.allowedMenus.length === 1 ? "" : "s"} (Dashboard always included).`
                                : "No restriction — this sub-login sees every menu."}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            {restrictableMenus.map(m => {
                                const selected = (form.allowedMenus ?? []).includes(m.menuKey)
                                return (
                                    <button type="button" key={m.menuKey} onClick={() => toggleMenuKey(m.menuKey)}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                                        <span className="text-sm truncate">{m.name}</span>
                                        {selected && <Check size={13} className="text-blue-600 shrink-0" />}
                                    </button>
                                )
                            })}
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
