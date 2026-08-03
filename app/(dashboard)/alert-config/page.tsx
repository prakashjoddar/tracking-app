"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertConfigListPanel } from "@/components/alert-config/AlertConfigListPanel"
import { AlertConfigForm } from "@/components/alert-config/AlertConfigForm"
import {
    fetchAlertConfigs,
    fetchDefaultAlertConfig,
    updateAlertConfig,
    updateDefaultAlertConfig,
    resetAlertConfig,
} from "@/lib/api"
import { AlertConfigEntry, AlertConfigUpdateRequest } from "@/lib/types"
import { toast } from "sonner"

export default function AlertConfigPage() {

    const [configs, setConfigs] = useState<AlertConfigEntry[]>([])
    const [defaultConfig, setDefaultConfig] = useState<AlertConfigUpdateRequest | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedVehicleNo, setSelectedVehicleNo] = useState<string | null>(null)
    const [editingDefault, setEditingDefault] = useState(false)

    const load = useCallback(async (): Promise<void> => {
        try {
            setLoading(true)
            const [vehicleConfigs, orgDefault] = await Promise.all([
                fetchAlertConfigs(),
                fetchDefaultAlertConfig(),
            ])
            setConfigs(vehicleConfigs)
            setDefaultConfig(orgDefault)
        } catch (e) {
            console.error("Failed to fetch alert configs:", e)
            toast.error("Failed to load alert settings")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const selectedConfig = configs.find((c) => c.vehicleNo === selectedVehicleNo) ?? null

    const selectVehicle = (vehicleNo: string): void => {
        setEditingDefault(false)
        setSelectedVehicleNo(vehicleNo)
    }

    const selectDefault = (): void => {
        setSelectedVehicleNo(null)
        setEditingDefault(true)
    }

    const closeForm = (): void => {
        setSelectedVehicleNo(null)
        setEditingDefault(false)
    }

    return (
        <div className="flex h-full w-full overflow-hidden">

            {/* LEFT — vehicle list */}
            <div className="w-[380px] border-r flex flex-col h-full overflow-hidden shrink-0">
                <AlertConfigListPanel
                    configs={configs}
                    loading={loading}
                    selectedVehicleNo={selectedVehicleNo}
                    isEditingDefault={editingDefault}
                    onSelect={selectVehicle}
                    onSelectDefault={selectDefault}
                    onRefresh={load}
                />
            </div>

            {/* RIGHT — form or empty state */}
            <div className="flex-1 h-full overflow-hidden">
                {editingDefault && defaultConfig ? (
                    <AlertConfigForm
                        title="Org Default"
                        subtitle="Applies to every vehicle without its own override"
                        initial={defaultConfig}
                        onClose={closeForm}
                        onSave={async (payload) => {
                            const updated = await updateDefaultAlertConfig(payload)
                            setDefaultConfig(updated)
                            // Vehicles following the default now display the new values.
                            await load()
                        }}
                    />
                ) : selectedConfig ? (
                    <AlertConfigForm
                        title="Edit Alert Config"
                        subtitle={`${selectedConfig.vehicleNo} — ${selectedConfig.vehicleName || "Unnamed"}`}
                        initial={selectedConfig}
                        orgDefault={defaultConfig}
                        showReset={selectedConfig.overridden}
                        onClose={closeForm}
                        onSave={async (payload) => {
                            const updated = await updateAlertConfig(selectedConfig.vehicleNo, payload)
                            setConfigs((prev) => prev.map((c) => (c.vehicleNo === updated.vehicleNo ? updated : c)))
                        }}
                        onReset={async () => {
                            await resetAlertConfig(selectedConfig.vehicleNo)
                            await load()
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">No vehicle selected</p>
                        <p className="text-xs">Click a vehicle in the list to edit its alert settings, or edit the Org Default</p>
                    </div>
                )}
            </div>

        </div>
    )
}
