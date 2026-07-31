"use client"

import { useEffect, useState } from "react"
import { ParentDetails, StudentRequestResponse } from "@/lib/types"
import { useStudentStore } from "@/store/student-store"
import { Input } from "@/components/ui/input"
import { Save, User, Phone, BookOpen, CreditCard, MapPin, X, Loader2, Plus, Trash2, Users, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { saveStudent } from "@/lib/api"
import { toast } from "sonner"

type Mode = "add" | "edit"

type StudentFormProps = {
    mode: Mode
    onClose: () => void
}

const defaultForm: Omit<StudentRequestResponse, "id" | "orgId"> = {
    firstName: "",
    lastName: "",
    email: "",
    rollNo: "",
    standard: "",
    rfid: "",
    mobileNo: "",
    address: "",
    parents: [],
    username: "",
    password: "",
}

const emptyParent = (): ParentDetails => ({ name: "", mobileNo: "", email: "", address: "", username: "", password: "" })

// ── outside component — stable references ─────────────────────────────────────

type SectionProps = { icon: React.ReactNode; title: string; children: React.ReactNode }
const Section = ({ icon, title, children }: SectionProps) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {icon}
            <span>{title}</span>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
            {children}
        </div>
    </div>
)

type FormFieldProps = { label: string; error?: string; span2?: boolean; children: React.ReactNode }
const FormField = ({ label, error, span2, children }: FormFieldProps) => (
    <div className={`space-y-1 ${span2 ? "col-span-2" : ""}`}>
        <label className="text-[11px] font-medium text-gray-600 ml-0.5">{label}</label>
        {children}
        {error && <p className="text-[10px] text-red-500 ml-0.5">{error}</p>}
    </div>
)

// ─────────────────────────────────────────────────────────────────────────────

export function StudentForm({ mode, onClose }: StudentFormProps) {
    const { students, editingStudentId, addStudent, updateStudent } = useStudentStore()

    const [form, setForm] = useState<typeof defaultForm>(defaultForm)
    const [parents, setParents] = useState<ParentDetails[]>([])
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof StudentRequestResponse, string>>>({})
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (mode === "edit" && editingStudentId) {
            const current = students.find(s => s.id === editingStudentId)
            if (current) {
                const { parents: p, ...rest } = current
                setForm({ ...defaultForm, ...rest })
                setParents(p && p.length > 0 ? p : [])
            }
        } else {
            setForm(defaultForm)
            setParents([])
        }
        setErrors({})
    }, [mode, editingStudentId, students])

    const validate = () => {
        const e: Partial<Record<keyof StudentRequestResponse, string>> = {}
        if (!form.firstName.trim()) e.firstName = "Required"
        if (!form.rollNo.trim()) e.rollNo = "Required"
        if (!form.standard.trim()) e.standard = "Required"
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email"
        if (form.username?.trim()) {
            if (!form.email?.trim()) e.email = "Email is required to enable a student login"
            if (!form.userId && !form.password?.trim()) e.password = "Required to create a login"
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async (): Promise<void> => {
        if (!validate()) return
        const badParent = parents.find(p => p.name.trim() && p.username?.trim() &&
            (!p.email?.trim() || (!p.userId?.trim() && !p.password?.trim())))
        if (badParent) {
            toast.error(`${badParent.name}: email is required, and a password is required to create a new parent login.`)
            return
        }
        try {
            setSaving(true)
            const payload: StudentRequestResponse = {
                ...(mode === "edit" && editingStudentId ? { id: editingStudentId } : {}),
                ...form,
                parents: parents.filter(p => p.name.trim()),
            }
            const saved = await saveStudent(payload)
            if (mode === "edit" && editingStudentId) {
                updateStudent(editingStudentId, saved)
                toast.success("Student updated")
            } else {
                addStudent(saved)
                toast.success("Student created")
            }
            onClose()
        } catch (e: any) {
            const msg = e.response?.data?.message || (typeof e.response?.data === "string" ? e.response.data : null) || e.message || "Failed to save."
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    // ── Parent helpers ────────────────────────────────────────────────────────

    const addParent = () => setParents(prev => [...prev, emptyParent()])

    const removeParent = (idx: number) =>
        setParents(prev => prev.filter((_, i) => i !== idx))

    const setParentField = (idx: number, key: keyof ParentDetails, value: string) =>
        setParents(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <User size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">
                            {mode === "add" ? "New Student" : "Edit Student"}
                        </h2>
                        <p className="text-[10px] text-gray-400">
                            {mode === "add" ? "Register a new student" : `Updating ${form.firstName}`}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                <Section icon={<User size={12} />} title="Personal Details">
                    <FormField label="First Name" error={errors.firstName}>
                        <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                            className={`h-8 text-xs ${errors.firstName ? "border-red-400" : ""}`} placeholder="John" />
                    </FormField>
                    <FormField label="Last Name">
                        <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                            className="h-8 text-xs" placeholder="Doe" />
                    </FormField>
                </Section>

                <Section icon={<BookOpen size={12} />} title="Academic & ID">
                    <FormField label="Roll Number" error={errors.rollNo}>
                        <Input value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })}
                            className={`h-8 text-xs font-mono ${errors.rollNo ? "border-red-400" : ""}`} placeholder="101" />
                    </FormField>
                    <FormField label="Class / Standard" error={errors.standard}>
                        <Input value={form.standard} onChange={e => setForm({ ...form, standard: e.target.value })}
                            className={`h-8 text-xs ${errors.standard ? "border-red-400" : ""}`} placeholder="10th - A" />
                    </FormField>
                    <FormField label="RFID / ID Number" span2>
                        <div className="relative">
                            <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
                            <Input value={form.rfid} onChange={e => setForm({ ...form, rfid: e.target.value })}
                                className="h-8 text-xs pl-8 font-mono" placeholder="A1B2C3D4" />
                        </div>
                    </FormField>
                </Section>

                <Section icon={<Phone size={12} />} title="Contact Info">
                    <FormField label="Email Address" error={errors.email} span2>
                        <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                            className={`h-8 text-xs ${errors.email ? "border-red-400" : ""}`} placeholder="student@school.com" />
                    </FormField>
                    <FormField label="Student Mobile">
                        <Input value={form.mobileNo} onChange={e => setForm({ ...form, mobileNo: e.target.value })}
                            className="h-8 text-xs" placeholder="+91" />
                    </FormField>
                    <FormField label="Home Address" span2>
                        <div className="relative">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
                            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                className="h-8 text-xs pl-8" placeholder="Location details..." />
                        </div>
                    </FormField>
                </Section>

                <Section icon={<Lock size={12} />} title="Student Login (optional)">
                    <FormField label="Username" error={errors.username}>
                        <Input value={form.username || ""} onChange={e => setForm({ ...form, username: e.target.value })}
                            className="h-8 text-xs" placeholder="Leave blank — no student login" />
                    </FormField>
                    <FormField label="Password" error={errors.password}>
                        <div className="relative">
                            <Input type={showPassword ? "text" : "password"} value={form.password || ""}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className={`h-8 text-xs pr-8 ${errors.password ? "border-red-400" : ""}`}
                                placeholder={form.userId ? "Leave blank to keep" : "••••••••"} />
                            <button type="button" onClick={() => setShowPassword(p => !p)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                        </div>
                    </FormField>
                    {form.userId && (
                        <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-green-600">
                            <CheckCircle2 size={12} />
                            <span>Login enabled for this student</span>
                        </div>
                    )}
                </Section>

                {/* Parents Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Users size={12} />
                        <span>Parents / Guardians</span>
                        <div className="flex-1 h-px bg-gray-100" />
                        <button
                            onClick={addParent}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors normal-case tracking-normal"
                        >
                            <Plus size={10} />
                            Add Parent
                        </button>
                    </div>

                    {parents.length === 0 ? (
                        <div
                            onClick={addParent}
                            className="flex flex-col items-center justify-center gap-1.5 py-6 border border-dashed border-gray-200 rounded-xl text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                        >
                            <Users size={18} className="text-gray-300" />
                            <p className="text-xs">No parents added yet</p>
                            <p className="text-[10px] text-gray-300">Click to add parent / guardian</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {parents.map((parent, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                                    {/* Parent header */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                            Parent {idx + 1}
                                        </span>
                                        <button
                                            onClick={() => removeParent(idx)}
                                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={10} />
                                            Remove
                                        </button>
                                    </div>

                                    {/* Parent fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Full Name *</label>
                                            <Input
                                                value={parent.name}
                                                onChange={e => setParentField(idx, "name", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder="Parent / Guardian name"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Mobile *</label>
                                            <Input
                                                value={parent.mobileNo}
                                                onChange={e => setParentField(idx, "mobileNo", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Email</label>
                                            <Input
                                                type="email"
                                                value={parent.email || ""}
                                                onChange={e => setParentField(idx, "email", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder="parent@email.com"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Address</label>
                                            <Input
                                                value={parent.address || ""}
                                                onChange={e => setParentField(idx, "address", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder="Parent address (if different)"
                                            />
                                        </div>

                                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest pt-1">
                                            <Lock size={11} />
                                            <span>Login (optional)</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Username</label>
                                            <Input
                                                value={parent.username || ""}
                                                onChange={e => setParentField(idx, "username", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder="Leave blank — no login"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-gray-600 ml-0.5">Password</label>
                                            <Input
                                                type="password"
                                                value={parent.password || ""}
                                                onChange={e => setParentField(idx, "password", e.target.value)}
                                                className="h-8 text-xs bg-white"
                                                placeholder={parent.userId ? "Leave blank to keep" : "••••••••"}
                                            />
                                        </div>
                                        {parent.userId && (
                                            <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-green-600">
                                                <CheckCircle2 size={12} />
                                                <span>Login enabled for this parent</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add next parent button — only on last card */}
                                    {idx === parents.length - 1 && (
                                        <button
                                            onClick={addParent}
                                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Plus size={11} />
                                            Add Another Parent
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t bg-gray-50/50 flex justify-end gap-2">
                <button onClick={onClose}
                    className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {saving ? "Saving..." : "Save Student"}
                </button>
            </div>
        </div>
    )
}
