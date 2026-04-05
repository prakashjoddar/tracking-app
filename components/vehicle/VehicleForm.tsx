"use client"

import { useEffect, useState } from "react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { Vehicle, RfidType } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, Cpu, FileCheck, Phone, Save, Satellite, X } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

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
    checkImeiExist: false,
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
    extra?: React.ReactNode
}
const FormField = ({ label, error, children, extra }: FormFieldProps) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {extra}
        </div>
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
            return { ...EMPTY, ...rest }
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
            setForm({ ...EMPTY, ...rest })
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

    const handleSave = async (stayOpen: boolean = false): Promise<void> => {
        if (!validate()) return

        try {
            setSaving(true)

            const payload: any = {
                id: editingVehicleId || undefined,
                imei: form.imei,
                number: form.number,
                name: form.name,
                description: form.description,
                rfidType: form.rfidType,
                simNumber: form.simNumber,
                rechargeExpiry: form.rechargeExpiry || null,
                certificateExpiry: form.certificateExpiry || null,
                deviceManufacturer: form.deviceManufacturer,
                deviceModelNumber: form.deviceModelNumber,
                vehicleManufacturer: form.vehicleManufacturer,
                vehicleModelNumber: form.vehicleModelNumber,
                checkImeiExist: Boolean(form.checkImeiExist)
            };
            
            console.log("CRITICAL DEBUG - Sending this to API:", JSON.stringify(payload, null, 2));

            const res = await api.post<Vehicle>("/vehicle", payload);
            
            // Re-fetch the entire list from the server to ensure we have the most accurate "response" data
            await useVehicleManageStore.getState().fetchVehicles()
            
            if (mode === "edit" && editingVehicleId) {
                setEditingVehicleId(null)
            }

            if (stayOpen) {
                setForm(EMPTY)
                setErrors({})
                toast.success("Vehicle added successfully! Form cleared for next entry.")
            } else {
                toast.success(mode === "edit" ? "Vehicle updated successfully!" : "Vehicle added successfully!")
                onClose()
            }
        } catch (e: any) {
            console.error("Save failed:", e)
            const msg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : null) || e.message || "Failed to save vehicle"
            toast.error(msg)
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
                    <FormField 
                        label="IMEI" 
                        error={errors.imei}
                        extra={
                            <label className="inline-flex items-center gap-2 cursor-pointer ml-auto">
                                <input
                                    type="checkbox"
                                    checked={form.checkImeiExist}
                                    onChange={e => set("checkImeiExist", e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-[10px] text-gray-500 font-normal normal-case">Check IMEI exist</span>
                            </label>
                        }
                    >
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
                    className="px-4 py-2 text-sm font-medium rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                
                {mode === "add" && (
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60"
                    >
                        Save & Add New
                    </button>
                )}

                <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
                >
                    <Save size={14} />
                    {saving ? "Saving..." : mode === "edit" ? "Update" : "Add Vehicle"}
                </button>
            </div>

        </div>
    )
}