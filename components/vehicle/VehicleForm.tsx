"use client"

import { useEffect, useState } from "react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { Vehicle, RfidType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, Cpu, FileCheck, Phone, Save, Satellite, X } from "lucide-react"
import axios from "axios"

type Mode = "add" | "edit"

type VehicleFormProps = {
    mode: Mode
    onClose: () => void
}

const EMPTY: Omit<Vehicle, "id"> = {
    imei: "", number: "", name: "", description: "",
    rfidType: "NONE", simNumber: "",
    rechargeExpiry: "", certificateExpiry: "",
    deviceManufacturer: "", deviceModelNumber: "",
    vehicleManufacturer: "", vehicleModelNumber: "",
}

type FieldError = Partial<Record<keyof Omit<Vehicle, "id">, string>>

// ✅ Outside VehicleForm — defined once, never recreated

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

type FormFieldProps = {
    label: string
    error?: string
    children: React.ReactNode
}
const FormField = ({ label, error, children }: FormFieldProps) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {children}
        {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
)

export function VehicleForm({ mode, onClose }: VehicleFormProps) {

    const { editingVehicleId, vehicles, updateVehicle, addVehicle, setEditingVehicleId } = useVehicleManageStore()
    const editingVehicle = vehicles.find(v => v.id === editingVehicleId) ?? null

    const initialForm = (): Omit<Vehicle, "id"> => {
        const { editingVehicleId, vehicles } = useVehicleManageStore.getState()
        const vehicle = vehicles.find(v => v.id === editingVehicleId) ?? null
        if (mode === "edit" && vehicle) {
            const { id, ...rest } = vehicle
            return rest
        }
        return EMPTY
    }

    const [form, setForm] = useState<Omit<Vehicle, "id">>(initialForm)
    const [errors, setErrors] = useState<FieldError>({})
    const [saving, setSaving] = useState<boolean>(false)

    useEffect(() => {
        const { editingVehicleId, vehicles } = useVehicleManageStore.getState()
        const vehicle = vehicles.find(v => v.id === editingVehicleId) ?? null
        if (mode === "edit" && vehicle) {
            const { id, ...rest } = vehicle
            setForm(rest)
        } else {
            setForm(EMPTY)
        }
        setErrors({})
    }, [editingVehicleId, mode])

    const set = <K extends keyof Omit<Vehicle, "id">>(key: K, value: Omit<Vehicle, "id">[K]): void => {
        setForm(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: undefined }))
    }

    const validate = (): boolean => {
        const e: FieldError = {}
        if (!form.number) e.number = "Vehicle number is required"
        // if (!form.imei || form.imei.length < 15) e.imei = "Valid IMEI (15 digits) required"
        // if (!form.simNumber) e.simNumber = "SIM number is required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = async (): Promise<void> => {
        if (!validate()) return

        try {
            setSaving(true)

            if (mode === "edit" && editingVehicleId) {
                const res = await axios.post<Vehicle>("http://localhost:6004/vehicle", { id: editingVehicleId, ...form })
                updateVehicle(editingVehicleId, res.data)
                setEditingVehicleId(null)
            } else {
                const res = await axios.post<Vehicle>("http://localhost:6004/vehicle", form)
                addVehicle(res.data)
            }

            onClose()
        } catch (e) {
            console.error("Save failed:", e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-sm">
                        {mode === "edit" ? "Edit Vehicle" : "Add New Vehicle"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {mode === "edit" ? `Editing ${editingVehicle?.number}` : "Fill in vehicle details below"}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                <Section icon={<Bus size={13} />} title="Vehicle Info">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Vehicle Number *" error={errors.number}>
                            <Input
                                value={form.number}
                                onChange={e => set("number", e.target.value)}
                                placeholder="MH12AB1234"
                                className={errors.number ? "border-red-400" : ""}
                            />
                        </FormField>
                        <FormField label="Vehicle Name">
                            <Input
                                value={form.name}
                                onChange={e => set("name", e.target.value)}
                                placeholder="School Bus 1"
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Manufacturer">
                            <Input
                                value={form.vehicleManufacturer}
                                onChange={e => set("vehicleManufacturer", e.target.value)}
                                placeholder="TATA"
                            />
                        </FormField>
                        <FormField label="Model">
                            <Input
                                value={form.vehicleModelNumber}
                                onChange={e => set("vehicleModelNumber", e.target.value)}
                                placeholder="Starbus"
                            />
                        </FormField>
                    </div>
                    <FormField label="Description">
                        <textarea
                            value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Optional notes..."
                            rows={2}
                            className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                        />
                    </FormField>
                </Section>

                <Section icon={<Cpu size={13} />} title="Device Info">
                    <FormField label="IMEI" error={errors.imei}>
                        <Input
                            value={form.imei}
                            onChange={e => set("imei", e.target.value)}
                            placeholder="15-digit IMEI"
                            maxLength={15}
                            className={`font-mono ${errors.imei ? "border-red-400" : ""}`}
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Manufacturer">
                            <Input
                                value={form.deviceManufacturer}
                                onChange={e => set("deviceManufacturer", e.target.value)}
                                placeholder="Concox"
                            />
                        </FormField>
                        <FormField label="Model">
                            <Input
                                value={form.deviceModelNumber}
                                onChange={e => set("deviceModelNumber", e.target.value)}
                                placeholder="GT06N"
                            />
                        </FormField>
                    </div>
                    <FormField label="RFID Type">
                        <Select
                            value={form.rfidType}
                            onValueChange={v => set("rfidType", v as RfidType)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="NONE">None</SelectItem>
                                    <SelectItem value="INTERNAL">Internal</SelectItem>
                                    <SelectItem value="EXTERNAL">External</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </FormField>
                </Section>

                <Section icon={<Phone size={13} />} title="SIM & Expiry">
                    <FormField label="SIM Number" error={errors.simNumber}>
                        <Input
                            value={form.simNumber}
                            onChange={e => set("simNumber", e.target.value)}
                            placeholder="91XXXXXXXXXX"
                            className={`font-mono ${errors.simNumber ? "border-red-400" : ""}`}
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Recharge Expiry">
                            <Input
                                type="date"
                                value={form.rechargeExpiry?.split("T")[0] ?? ""}
                                onChange={e => set("rechargeExpiry", e.target.value)}
                            />
                        </FormField>
                        <FormField label="Certificate Expiry">
                            <Input
                                type="date"
                                value={form.certificateExpiry?.split("T")[0] ?? ""}
                                onChange={e => set("certificateExpiry", e.target.value)}
                            />
                        </FormField>
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                    <Save size={14} />
                    {saving ? "Saving..." : mode === "edit" ? "Update" : "Add Vehicle"}
                </button>
            </div>

        </div>
    )
}