"use client"

import { DatePicker } from "antd"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { RangePickerProps } from "antd/es/date-picker"
import { useState } from "react"
import { Loader2, Wand2, X } from "lucide-react"
import { cn } from "@/lib/utils"

const { RangePicker } = DatePicker

type Props = {
    tripName: string
    onSubmit: (startDate: string, endDate: string) => Promise<void>
    onClose: () => void
}

export function WaypointInitModal({ tripName, onSubmit, onClose }: Props) {
    const [dateRange, setDateRange] = useState<[string, string] | null>(null)
    const [enableTime, setEnableTime] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const disabledDate: RangePickerProps["disabledDate"] = (current) =>
        current && current > dayjs().endOf("day")

    const onDateChange = (dates: (Dayjs | null)[] | null) => {
        if (dates && dates[0] && dates[1]) {
            if (enableTime) {
                setDateRange([
                    dates[0].format("YYYY-MM-DDTHH:mm:ss"),
                    dates[1].format("YYYY-MM-DDTHH:mm:ss"),
                ])
            } else {
                // No time selected — use start of day for start, end of day for end
                setDateRange([
                    dates[0].format("YYYY-MM-DD") + "T00:00:00",
                    dates[1].format("YYYY-MM-DD") + "T23:59:59",
                ])
            }
        } else {
            setDateRange(null)
        }
    }

    const handleSubmit = async () => {
        if (!dateRange) return
        try {
            setLoading(true)
            await onSubmit(dateRange[0], dateRange[1])
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Card */}
            <div className="relative z-10 w-[400px] bg-white rounded-2xl shadow-2xl border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                            <Wand2 size={14} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Initialize Route</h3>
                            <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{tripName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    <p className="text-xs text-gray-500">
                        Select the date range to generate waypoints from vehicle GPS history.
                        The route will be computed and stored for this trip.
                    </p>

                    {/* Date range */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                Date Range
                            </label>
                            <button
                                onClick={() => setEnableTime(v => !v)}
                                className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                                    enableTime
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                {enableTime ? "Time ON" : "Time OFF"}
                            </button>
                        </div>
                        <RangePicker
                            className="w-full"
                            disabledDate={disabledDate}
                            showTime={enableTime ? {
                                defaultOpenValue: [dayjs("00:00:00", "HH:mm:ss"), dayjs("23:59:59", "HH:mm:ss")]
                            } : false}
                            onChange={onDateChange}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!dateRange || loading}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {loading
                            ? <><Loader2 size={12} className="animate-spin" /> Initializing...</>
                            : <><Wand2 size={12} /> Initialize</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
