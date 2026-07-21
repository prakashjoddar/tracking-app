"use client"

import { useEffect, useState } from "react"
import { AlertConfigUpdateRequest } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { BellRing, Gauge, RotateCcw, Save, X } from "lucide-react"
import { toast } from "sonner"

type AlertConfigFormProps = {
    title: string
    subtitle: string
    initial: AlertConfigUpdateRequest
    /** Shown only when editing a vehicle that currently has an explicit override. */
    showReset?: boolean
    onClose: () => void
    onSave: (payload: AlertConfigUpdateRequest) => Promise<void>
    onReset?: () => Promise<void>
}

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

type FormFieldProps = { label: string; suffix?: string; children: React.ReactNode }
const FormField = ({ label, suffix, children }: FormFieldProps) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">{label}{suffix ? ` (${suffix})` : ""}</label>
        {children}
    </div>
)

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-100 bg-gray-50 cursor-pointer">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <Switch checked={checked} onCheckedChange={onChange} />
    </label>
)

const inputClass = "w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"

export function AlertConfigForm({ title, subtitle, initial, showReset, onClose, onSave, onReset }: AlertConfigFormProps) {

    const [form, setForm] = useState<AlertConfigUpdateRequest>(initial)
    const [saving, setSaving] = useState(false)
    const [resetting, setResetting] = useState(false)

    useEffect(() => {
        setForm(initial)
    }, [initial])

    const set = <K extends keyof AlertConfigUpdateRequest>(key: K, value: AlertConfigUpdateRequest[K]): void => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = async (): Promise<void> => {
        try {
            setSaving(true)
            await onSave(form)
            toast.success("Alert config updated successfully!")
        } catch (e: any) {
            console.error("Save failed:", e)
            const msg = e.response?.data?.message || (typeof e.response?.data === "string" ? e.response.data : null) || e.message || "Failed to save alert config"
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = async (): Promise<void> => {
        if (!onReset) return
        try {
            setResetting(true)
            await onReset()
            toast.success("Reset to org default.")
        } catch (e: any) {
            console.error("Reset failed:", e)
            toast.error(e.response?.data?.message || "Failed to reset alert config")
        } finally {
            setResetting(false)
        }
    }

    return (
        // @container: this panel's rendered width is set by its parent split-layout
        // (a fixed-width list panel eats most of the viewport), not the viewport
        // itself — so breakpoints here must respond to the container, not `sm:`/`md:`
        // viewport variants, or a wide-viewport/narrow-panel layout (e.g. this sitting
        // next to the vehicle list) would wrongly force 2 columns and wrap labels.
        <div className="@container flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-4 @sm:px-6 py-4 border-b flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">{title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
                </div>
                <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-4 @sm:px-6 py-5 space-y-6">

                <Section icon={<Gauge size={13} />} title="Thresholds">
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Minimum Running Speed" suffix="km/h">
                            <input
                                type="number" step="0.1"
                                value={form.minimumRunningSpeed}
                                onChange={(e) => set("minimumRunningSpeed", Number(e.target.value))}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Over Speed Limit" suffix="km/h">
                            <input
                                type="number" step="0.1"
                                value={form.overSpeedLimit}
                                onChange={(e) => set("overSpeedLimit", Number(e.target.value))}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Low Battery" suffix="%">
                            <input
                                type="number" step="0.1"
                                value={form.lowBatteryPercentage}
                                onChange={(e) => set("lowBatteryPercentage", Number(e.target.value))}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Alert Threshold Count">
                            <input
                                type="number" step="1"
                                value={form.thresholdLimit}
                                onChange={(e) => set("thresholdLimit", Number(e.target.value))}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<BellRing size={13} />} title="Alert Types">
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                        <ToggleRow label="Ignition On/Off" checked={form.ignitionAlert} onChange={(v) => set("ignitionAlert", v)} />
                        <ToggleRow label="Over Speed" checked={form.overSpeedAlert} onChange={(v) => set("overSpeedAlert", v)} />
                        <ToggleRow label="Running / Idle / Parked" checked={form.stateAlert} onChange={(v) => set("stateAlert", v)} />
                        <ToggleRow label="Low Battery" checked={form.lowBatteryAlert} onChange={(v) => set("lowBatteryAlert", v)} />
                        <ToggleRow label="Geofence Enter/Exit" checked={form.geoFenceAlert} onChange={(v) => set("geoFenceAlert", v)} />
                        <ToggleRow label="Trip" checked={form.tripAlert} onChange={(v) => set("tripAlert", v)} />
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 @sm:px-6 py-4 border-t bg-gray-50 flex flex-col @sm:flex-row @sm:justify-end gap-2">
                {showReset && (
                    <button
                        onClick={handleReset}
                        disabled={resetting || saving}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60 w-full @sm:w-auto @sm:mr-auto"
                    >
                        <RotateCcw size={14} />
                        {resetting ? "Resetting..." : "Reset to Default"}
                    </button>
                )}
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors w-full @sm:w-auto">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 w-full @sm:w-auto"
                >
                    <Save size={14} />
                    {saving ? "Saving..." : "Update"}
                </button>
            </div>

        </div>
    )
}
