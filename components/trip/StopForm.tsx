"use client"

import { useEffect, useState } from "react"
import { Drawer, DrawerProps, Flex, Button as AntBtn } from "antd"
import { Radio } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useTripStore } from "@/store/trip-store"
import { useStudentStore } from "@/store/student-store"
import { Stop } from "@/lib/types"
import { MapPin, Navigation, Tag, Users, Save, X, RotateCcw, Search, GraduationCap, Phone, Check, Loader2, Map } from "lucide-react"
import { fetchStudents } from "@/lib/api"
import { toast } from "sonner"

type StopFormProps = {
    setShowMap: (value: boolean) => void
}

type FieldError = Partial<Record<keyof Omit<Stop, "id" | "snapToRoute" | "studentId" | "tripId">, string>>
type StopFormData = Omit<Stop, "id" | "snapToRoute" | "studentId" | "tripId">

const EMPTY: StopFormData = {
    name: "",
    latitude: 0,
    longitude: 0,
    type: "PICK_DROP",
    enable: true,
}

// ── outside component — never recreated ──────────────────────────────────────

type SectionProps = { icon: React.ReactNode; title: string; children: React.ReactNode }
const Section = ({ icon, title, children }: SectionProps) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {icon}
            <span>{title}</span>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
        {children}
    </div>
)

type FormFieldProps = { label: string; hint?: string; error?: string; children: React.ReactNode }
const FormField = ({ label, hint, error, children }: FormFieldProps) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
        </div>
        {children}
        {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
)

// ─────────────────────────────────────────────────────────────────────────────

export default function StopForm({ setShowMap }: StopFormProps) {

    const stops = useTripStore(s => s.stops)
    const editingStopId = useTripStore(s => s.editingStopId)
    const pendingLatLng = useTripStore(s => s.pendingLatLng)
    const updateStop = useTripStore(s => s.updateStop)
    const setEditingStopId = useTripStore(s => s.setEditingStopId)
    const setPendingLatLng = useTripStore(s => s.setPendingLatLng)

    const { students, setStudents, loading: studentsLoading, setLoading: setStudentsLoading } = useStudentStore()

    const editingStop = stops.find(s => s.id === editingStopId) ?? null

    const [form, setForm] = useState<Omit<Stop, "id" | "snapToRoute" | "studentId" | "tripId">>(EMPTY)
    const [errors, setErrors] = useState<FieldError>({})
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    const [studentSearch, setStudentSearch] = useState<string>("")

    // fill form when editing stop changes
    useEffect(() => {
        if (editingStop) {
            setForm({
                name: editingStop.name,
                latitude: editingStop.latitude,
                longitude: editingStop.longitude,
                type: editingStop.type,
                enable: editingStop.enable,
            })
            setSelectedStudentIds((editingStop.studentId ?? []).map(String))
        } else {
            setForm(EMPTY)
            setSelectedStudentIds([])
        }
        setErrors({})
    }, [editingStopId])

    // load students when drawer opens
    useEffect(() => {
        if (!drawerOpen) return
        if (students.length > 0) return
        const load = async () => {
            try {
                setStudentsLoading(true)
                const data = await fetchStudents()
                setStudents(data)
            } catch (e) {
                console.error("Failed to load students:", e)
            } finally {
                setStudentsLoading(false)
            }
        }
        load()
    }, [drawerOpen])

    // auto-fill coords from map click
    useEffect(() => {
        if (pendingLatLng) {
            setForm(prev => ({
                ...prev,
                latitude: pendingLatLng.lat,
                longitude: pendingLatLng.lng,
            }))
        }
    }, [pendingLatLng])

    const set = <K extends keyof typeof form>(key: K, value: typeof form[K]): void => {
        setForm(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: undefined }))
    }

    const validate = (): boolean => {
        const e: FieldError = {}
        if (!form.name.trim()) e.name = "Stop name is required"
        if (!form.latitude || !form.longitude) e.latitude = "Coordinates are required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    // const handleUpdate = (): void => {
    //     if (!validate() || !editingStopId) return
    //     updateStop(editingStopId, form)
    //     setEditingStopId(null)
    //     setPendingLatLng(null)
    //     setShowMap(true)
    // }

    const handleUpdate = (): void => {
        if (!validate()) return
        const { editingStopId, selectedTripId, editingTripId, updateStop, addStop } = useTripStore.getState()
        const tripId = selectedTripId ?? editingTripId ?? ""

        if (editingStopId) {
            updateStop(editingStopId, {
                name: form.name,
                enable: form.enable,
                type: form.type,
                latitude: form.latitude,
                longitude: form.longitude,
                studentId: selectedStudentIds,
            })
            toast.success("Stop updated — press Save to persist")
        } else {
            addStop({
                id: `temp_${Date.now()}`,
                name: form.name,
                enable: form.enable,
                type: form.type,
                latitude: form.latitude,
                longitude: form.longitude,
                studentId: selectedStudentIds,
                tripId,
                sequence: stops.length + 1,
                snapToRoute: true,
            })
            toast.success("Stop added — press Save to persist")
        }

        setEditingStopId(null)
        setPendingLatLng(null)
        setSelectedStudentIds([])
        setForm(EMPTY)
        setShowMap(true)
    }


    const handleClose = (): void => {
        setEditingStopId(null)
        setPendingLatLng(null)
        setForm(EMPTY)
        setErrors({})
        setShowMap(true)
    }

    const states: CheckboxGroupProps<boolean>["options"] = [
        { label: "Enable", value: true },
        { label: "Disable", value: false },
    ]

    const drawerStyles: DrawerProps["styles"] = () => ({
        header: { padding: 16 },
        body: { padding: 16 },
        footer: { padding: "12px 16px", backgroundColor: "#fafafa" },
    })

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <MapPin size={15} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">
                            {editingStop ? "Edit Stop" : "New Stop"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {editingStop
                                ? `Editing — ${editingStop.name || "Unnamed stop"}`
                                : "Click on the map to place a stop"
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={15} className="text-gray-400" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                <Section icon={<Tag size={13} />} title="Stop Info">
                    <FormField label="Stop ID" hint="Auto-generated">
                        <Input
                            disabled
                            value={editingStopId ?? ""}
                            placeholder="Auto-generated"
                            className="bg-gray-50 text-gray-400 font-mono text-xs"
                        />
                    </FormField>

                    <FormField label="Stop Name *" error={errors.name}>
                        <Input
                            value={form.name}
                            onChange={e => set("name", e.target.value)}
                            placeholder="e.g. Diamond Point, School Gate"
                            className={errors.name ? "border-red-400" : ""}
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Stop Type">
                            <Select
                                value={form.type}
                                onValueChange={v => set("type", v as Stop["type"])}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectGroup>
                                        <SelectItem value="BUS_STOP">Bus Stop</SelectItem>
                                        <SelectItem value="PICK_DROP">Pick / Drop Point</SelectItem>
                                        <SelectItem value="INSTITUTE">Institute</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Status">
                            <Radio.Group
                                options={states}
                                value={form.enable}
                                optionType="button"
                                buttonStyle="solid"
                                onChange={e => set("enable", e.target.value)}
                            />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<Navigation size={13} />} title="Coordinates">
                    <button
                        onClick={() => setShowMap(true)}
                        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                        <Map size={12} />
                        Set Location on Map
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Latitude" error={errors.latitude}>
                            <Input
                                type="number"
                                value={form.latitude || ""}
                                onChange={e => set("latitude", parseFloat(e.target.value))}
                                placeholder="21.14580"
                                className={`font-mono text-xs ${errors.latitude ? "border-red-400" : ""}`}
                            />
                        </FormField>
                        <FormField label="Longitude">
                            <Input
                                type="number"
                                value={form.longitude || ""}
                                onChange={e => set("longitude", parseFloat(e.target.value))}
                                placeholder="79.08820"
                                className="font-mono text-xs"
                            />
                        </FormField>
                    </div>

                    {/* Coords preview pill */}
                    {(form.latitude !== 0 || form.longitude !== 0) && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <Navigation size={12} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-600 font-mono">
                                {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                            </span>
                            <span className="ml-auto text-[10px] text-blue-400">
                                from map
                            </span>
                        </div>
                    )}
                </Section>

                <Section icon={<Users size={13} />} title="Students">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                        <div>
                            <p className="text-sm font-medium">Assigned Students</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {selectedStudentIds.length > 0
                                    ? `${selectedStudentIds.length} student${selectedStudentIds.length > 1 ? "s" : ""} selected`
                                    : "No students assigned"
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Users size={12} />
                            Manage ({selectedStudentIds.length})
                        </button>
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <RotateCcw size={13} />
                    Cancel
                </button>
                <button
                    onClick={handleUpdate}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <Save size={13} />
                    {editingStop ? "Update Stop" : "Save Stop"}
                </button>
            </div>

            {/* Students Drawer */}
            <Drawer
                width={440}
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <GraduationCap size={14} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm leading-tight">Select Students</p>
                            <p className="text-[11px] text-gray-400 font-normal">
                                {selectedStudentIds.length} selected
                            </p>
                        </div>
                    </div>
                }
                styles={drawerStyles}
                mask={{ enabled: true, blur: true }}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                destroyOnHidden={false}
                footer={
                    <Flex justify="space-between" align="center">
                        <span className="text-xs text-gray-400">
                            {selectedStudentIds.length} of {students.length} selected
                        </span>
                        <Flex gap={8}>
                            <AntBtn
                                size="middle"
                                onClick={() => setSelectedStudentIds([])}
                                disabled={selectedStudentIds.length === 0}
                            >
                                Clear All
                            </AntBtn>
                            <AntBtn
                                type="primary"
                                size="middle"
                                styles={{ root: { backgroundColor: "#2563eb" } }}
                                onClick={() => setDrawerOpen(false)}
                            >
                                Confirm Selection
                            </AntBtn>
                        </Flex>
                    </Flex>
                }
            >
                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 mb-4">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search by name, roll no, class..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>

                {studentsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <p className="text-xs">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <GraduationCap size={24} />
                        <p className="text-xs">No students found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {students
                            .filter(s => {
                                const q = studentSearch.toLowerCase()
                                return (
                                    `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
                                    s.rollNo?.toLowerCase().includes(q) ||
                                    s.standard?.toLowerCase().includes(q)
                                )
                            })
                            .map(student => {
                                const sid = student.id ?? ""
                                const isSelected = !!sid && selectedStudentIds.includes(sid)
                                const toggle = () => {
                                    if (!sid) return
                                    setSelectedStudentIds(prev =>
                                        isSelected ? prev.filter(id => id !== sid) : [...prev, sid]
                                    )
                                }
                                return (
                                    <div
                                        key={student.id}
                                        onClick={toggle}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                            ${isSelected
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                                            ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}
                                        >
                                            {isSelected
                                                ? <Check size={14} />
                                                : (student.firstName?.[0] ?? "S").toUpperCase()
                                            }
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                                                    {student.standard}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-mono truncate">
                                                    {student.rollNo}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        {student.mobileNo && (
                                            <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                                                <Phone size={10} />
                                                <span>{student.mobileNo}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        }
                    </div>
                )}
            </Drawer>

        </div>
    )
}