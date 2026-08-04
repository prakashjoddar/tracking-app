"use client"

import { useEffect, useState } from "react"
import { AlertConfigUpdateRequest } from "@/lib/types"
import { Switch } from "@/components/ui/switch"
import { BellRing, Gauge, RotateCcw, Save, ShieldAlert, Timer, TrendingUp, X } from "lucide-react"
import { toast } from "sonner"

/** Mirrors gps-engine's AlertConfigService hardcoded fallback defaults (app.trip.approach-radius-m,
 * app.trip.departure-multiplier, app.trip.sequence-stall-timeout-min, app.geofence.confirm-points,
 * app.alert.harsh-*-default, app.alert.tampering-*-default) — used only to show what's currently
 * in effect as placeholder text when a field is left blank. */
const ENGINE_DEFAULTS = {
    approachRadiusM: 1000,
    departureMultiplier: 2,
    missedStopTimeoutMin: 20,
    geofenceConfirmPoints: 2,
    harshBrakingDecelThreshold: 8,
    harshAccelThreshold: 8,
    harshCorneringDegPerSec: 25,
    minSpeedForHarshEventKmh: 10,
    tamperingDistanceThresholdM: 50,
    tamperingSpeedThresholdKmh: 5,
    tamperingGracePeriodSec: 60,
}

type AlertConfigFormProps = {
    title: string
    subtitle: string
    initial: AlertConfigUpdateRequest
    /** The org default's values — used only for placeholder text on the 4 optional Trip Timing
     * fields when editing a per-vehicle form (omitted when editing the org default itself, since
     * there's nothing further to fall back to but the hardcoded engine default). */
    orgDefault?: AlertConfigUpdateRequest | null
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

export function AlertConfigForm({ title, subtitle, initial, orgDefault, showReset, onClose, onSave, onReset }: AlertConfigFormProps) {

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
                        <ToggleRow
                            label="Harsh Driving"
                            checked={form.harshDrivingAlert ?? orgDefault?.harshDrivingAlert ?? true}
                            onChange={(v) => set("harshDrivingAlert", v)}
                        />
                        {/* No gps-engine Strategy implementation exists yet for this one — toggle
                        wired up ahead of that so the config UI already works once one is written. */}
                        <ToggleRow
                            label="External Power Cut/Restore"
                            checked={form.externalPowerAlert ?? orgDefault?.externalPowerAlert ?? true}
                            onChange={(v) => set("externalPowerAlert", v)}
                        />
                        <ToggleRow
                            label="Tampering"
                            checked={form.tamperingAlert ?? orgDefault?.tamperingAlert ?? true}
                            onChange={(v) => set("tamperingAlert", v)}
                        />
                    </div>
                </Section>

                <Section icon={<Timer size={13} />} title="Trip Timing (optional)">
                    <p className="text-[11px] text-gray-400 -mt-1">
                        Leave blank to use the value shown as a placeholder — the org default, or the app's own built-in default.
                    </p>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Approach / Arriving Distance" suffix="m">
                            <input
                                type="number" step="1"
                                value={form.approachRadiusM ?? ""}
                                onChange={(e) => set("approachRadiusM", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.approachRadiusM ?? ENGINE_DEFAULTS.approachRadiusM)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Departure Multiplier" suffix="× stop radius">
                            <input
                                type="number" step="0.1"
                                value={form.departureMultiplier ?? ""}
                                onChange={(e) => set("departureMultiplier", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.departureMultiplier ?? ENGINE_DEFAULTS.departureMultiplier)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Missed Stop Timeout" suffix="min">
                            <input
                                type="number" step="1"
                                value={form.missedStopTimeoutMin ?? ""}
                                onChange={(e) => set("missedStopTimeoutMin", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.missedStopTimeoutMin ?? ENGINE_DEFAULTS.missedStopTimeoutMin)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Geofence Confirm Points" suffix="GPS points">
                            <input
                                type="number" step="1"
                                value={form.geofenceConfirmPoints ?? ""}
                                onChange={(e) => set("geofenceConfirmPoints", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.geofenceConfirmPoints ?? ENGINE_DEFAULTS.geofenceConfirmPoints)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<TrendingUp size={13} />} title="Harsh Driving Thresholds (optional)">
                    <p className="text-[11px] text-gray-400 -mt-1">
                        Leave blank to use the value shown as a placeholder — the org default, or the app's own built-in default.
                    </p>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Harsh Braking" suffix="km/h per second">
                            <input
                                type="number" step="0.1"
                                value={form.harshBrakingDecelThreshold ?? ""}
                                onChange={(e) => set("harshBrakingDecelThreshold", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.harshBrakingDecelThreshold ?? ENGINE_DEFAULTS.harshBrakingDecelThreshold)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Harsh Acceleration" suffix="km/h per second">
                            <input
                                type="number" step="0.1"
                                value={form.harshAccelThreshold ?? ""}
                                onChange={(e) => set("harshAccelThreshold", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.harshAccelThreshold ?? ENGINE_DEFAULTS.harshAccelThreshold)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Harsh Cornering" suffix="degrees per second">
                            <input
                                type="number" step="0.1"
                                value={form.harshCorneringDegPerSec ?? ""}
                                onChange={(e) => set("harshCorneringDegPerSec", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.harshCorneringDegPerSec ?? ENGINE_DEFAULTS.harshCorneringDegPerSec)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Minimum Speed for Detection" suffix="km/h">
                            <input
                                type="number" step="0.1"
                                value={form.minSpeedForHarshEventKmh ?? ""}
                                onChange={(e) => set("minSpeedForHarshEventKmh", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.minSpeedForHarshEventKmh ?? ENGINE_DEFAULTS.minSpeedForHarshEventKmh)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<ShieldAlert size={13} />} title="Tampering Detection (optional)">
                    <p className="text-[11px] text-gray-400 -mt-1">
                        Detects unexpected movement while ignition is off (theft or an authorized tow — this can't tell them apart, it just flags it). Leave blank to use the value shown as a placeholder — the org default, or the app's own built-in default.
                    </p>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Distance Threshold" suffix="m">
                            <input
                                type="number" step="1"
                                value={form.tamperingDistanceThresholdM ?? ""}
                                onChange={(e) => set("tamperingDistanceThresholdM", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.tamperingDistanceThresholdM ?? ENGINE_DEFAULTS.tamperingDistanceThresholdM)}
                                className={inputClass}
                            />
                        </FormField>
                        <FormField label="Speed Threshold" suffix="km/h">
                            <input
                                type="number" step="0.1"
                                value={form.tamperingSpeedThresholdKmh ?? ""}
                                onChange={(e) => set("tamperingSpeedThresholdKmh", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.tamperingSpeedThresholdKmh ?? ENGINE_DEFAULTS.tamperingSpeedThresholdKmh)}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                        <FormField label="Grace Period After Key-Off" suffix="seconds">
                            <input
                                type="number" step="1"
                                value={form.tamperingGracePeriodSec ?? ""}
                                onChange={(e) => set("tamperingGracePeriodSec", e.target.value === "" ? null : Number(e.target.value))}
                                placeholder={String(orgDefault?.tamperingGracePeriodSec ?? ENGINE_DEFAULTS.tamperingGracePeriodSec)}
                                className={inputClass}
                            />
                        </FormField>
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
