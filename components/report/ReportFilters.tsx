"use client"

import { useEffect, useState } from "react"
import { DatePicker } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { RefreshCw, Search, Bus, Gauge, Layers } from "lucide-react"
import { useVehicleManageStore } from "@/store/vehicle-store"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { fetchVehicleGroups } from "@/lib/api"
import { VehicleGroupEntry } from "@/lib/types"

const { RangePicker } = DatePicker

type Props = {
    vehicleNo: string
    onVehicleChange: (v: string) => void
    range: [Dayjs, Dayjs]
    onRangeChange: (range: [Dayjs, Dayjs]) => void
    onRun: () => void
    onRefresh: () => void
    loading: boolean
    groupId?: string
    onGroupChange?: (v: string) => void
}

export function ReportFilters({ vehicleNo, onVehicleChange, range, onRangeChange, onRun, onRefresh, loading, groupId, onGroupChange }: Props) {
    const vehicles = useVehicleManageStore((s) => s.vehicles)
    const fetchVehicles = useVehicleManageStore((s) => s.fetchVehicles)
    useEffect(() => {
        if (vehicles.length === 0) fetchVehicles()
    }, [vehicles.length, fetchVehicles])

    const showGroupFilter = onGroupChange !== undefined

    const [groups, setGroups] = useState<VehicleGroupEntry[]>([])
    useEffect(() => {
        if (!showGroupFilter) return
        fetchVehicleGroups().then(setGroups).catch(() => {})
    }, [showGroupFilter])

    const selectedGroup = groups.find((g) => g.id === groupId)

    const scopedVehicles = selectedGroup
        ? vehicles.filter((v) => selectedGroup.vehicleNumbers.includes(v.number))
        : vehicles

    const vehicleOptions = [
        { label: "All Vehicles", value: "", icon: <Gauge size={14} className="text-slate-400" /> },
        ...scopedVehicles.map((v) => ({
            label: v.name || "Unnamed Vehicle",
            subLabel: v.number,
            value: v.number,
            icon: <Bus size={14} className="text-blue-500" />,
        })),
    ]

    const groupOptions = [
        { label: "All Groups", value: "", icon: <Layers size={14} className="text-slate-400" /> },
        ...groups.map((g) => ({
            label: g.name,
            subLabel: `${g.vehicleNumbers.length} vehicles`,
            value: g.id,
            icon: <Layers size={14} className="text-purple-500" />,
        })),
    ]

    const handleGroupChange = (v: string) => {
        onGroupChange?.(v)
        const nextGroup = groups.find((g) => g.id === v)
        if (nextGroup && vehicleNo && !nextGroup.vehicleNumbers.includes(vehicleNo)) {
            onVehicleChange("")
        }
    }

    return (
        <div className="flex items-end gap-2 flex-wrap">
            {showGroupFilter && (
                <div className="w-52">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vehicle Group</label>
                    <SearchableSelect options={groupOptions} value={groupId ?? ""} onChange={handleGroupChange} placeholder="All groups" />
                </div>
            )}
            <div className="w-60">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vehicle</label>
                <SearchableSelect options={vehicleOptions} value={vehicleNo} onChange={onVehicleChange} placeholder="All vehicles" />
            </div>
            <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Date Range</label>
                <RangePicker
                    value={range}
                    showTime={{ defaultOpenValue: [dayjs("00:00:00", "HH:mm:ss"), dayjs("23:59:59", "HH:mm:ss")] }}
                    allowClear={false}
                    disabledDate={(current) => !!current && current > dayjs().endOf("day")}
                    onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) onRangeChange([dates[0], dates[1]])
                    }}
                />
            </div>
            <button
                onClick={onRun}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
                <Search size={14} />
                Run Report
            </button>
            <button
                onClick={onRefresh}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-600 shadow-sm"
                title="Refresh"
            >
                <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
        </div>
    )
}
