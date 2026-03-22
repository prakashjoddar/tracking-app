"use client"

import { useHistoryStore } from "@/store/history-store"
import { DatePicker } from 'antd'
import { RangePickerProps } from "antd/es/date-picker"
import type { Dayjs } from 'dayjs'
import dayjs from "dayjs"
import { Pause, Play } from "lucide-react"
import { useEffect, useState } from "react"
import "react-day-picker/style.css"
import { Button } from "../ui/button"
import { SearchableSelect } from "../ui/searchable-select"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

export default function PlaybackPanel() {

    const { RangePicker } = DatePicker;

    const [vehicle, setVehicle] = useState<string>("")
    const [month, setMonth] = useState(new Date(2026, 0, 1));
    const [enableTime, setEnableTime] = useState(false);

    const playing = useHistoryStore(s => s.playing)
    const togglePlay = useHistoryStore(s => s.togglePlay)
    const index = useHistoryStore(s => s.index)
    const setIndex = useHistoryStore(s => s.setIndex)
    const points = useHistoryStore(s => s.points)

    const p = points[index]

    const maxSpeed = points.length
        ? Math.max(...points.map(p => p.speed))
        : 0

    const [speed, setSpeed] = useState(1);

    const increase = () => setSpeed((v) => Math.min(v + 1, 4));
    const decrease = () => setSpeed((v) => Math.max(v - 1, 1));


    const onChange = (date: Dayjs | (Dayjs | null)[] | null, dateString: string | string[] | null) => {
        console.log(date, dateString);
    };

    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current && (current > dayjs().endOf('day') || current.year() < 2026);
    };

    useEffect(() => {
        if (!playing) return

        const interval = setInterval(() => {
            if (index < points.length - 1) {
                setIndex(index + 1)
            } else {
                togglePlay()
            }
        }, 400 / speed)

        return () => clearInterval(interval)
    }, [playing, index, points.length])

    return (
        <div className="p-5 space-y-6">

            <div className="space-y-2">
                <SearchableSelect
                    options={[
                        { label: "AP28TD7553", value: "AP28TD7553" },
                        { label: "MH12AB2345", value: "MH12AB2345" },
                        { label: "DL8CAF1234", value: "DL8CAF1234" },
                    ]}
                    value={vehicle}
                    onChange={(val) => setVehicle(val)}
                    placeholder="Select vehicle"
                />

                {/* Date Range */}
                <div className="mt-1 flex flex-row items-center gap-3">
                    <span className="text-sm">Select Time</span>
                    <Tabs defaultValue="false" onValueChange={(val) => { setEnableTime(val == 'true') }}>
                        <TabsList variant="line" >
                            <TabsTrigger value="true">
                                Enable
                            </TabsTrigger>
                            <TabsTrigger value="false">
                                Disable
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <RangePicker
                    disabledDate={disabledDate}
                    showTime={enableTime ? {
                        defaultOpenValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('11:59:59', 'HH:mm:ss')],
                    } : false}
                    onChange={onChange} />

                {/* <DayPicker
                    // style={{
                    //     "--rdp-day-height": "34px",
                    //     "--rdp-day_button-height": "34px",
                    // } as React.CSSProperties}
                    animate captionLayout="dropdown"
                    endMonth={new Date(2026, 2, 1)}
                    mode="range"
                    month={month}
                    onMonthChange={setMonth}
                    navLayout="after"
                    startMonth={new Date(2020, 2, 1)}
                    weekStartsOn={0} /> */}

            </div>


            {/* Buttons */}

            <div className="flex flex-row justify-center mb-3">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white py-1.5 px-8 rounded-lg shadow">Load History</Button>
            </div>

            {/* Timeline */}
            <div className="space-y-1 mb-3">
                <input
                    type="range"
                    min={0}
                    max={points.length ? points.length - 1 : 0}
                    value={index}
                    onChange={(e) => setIndex(Number(e.target.value))}
                    className="w-full accent-blue-600"
                />
            </div>

            <div className="mt-1 flex flex-row items-center gap-3">
                {/* Play Button */}
                <button
                    onClick={togglePlay}
                    className="flex flex-row items-center justify-center gap-2 py-1.5 px-4 border rounded-lg bg-white hover:bg-muted shadow-sm"
                >
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {playing ? "Pause History" : "Play History"}
                </button>

                <div className="flex items-center border rounded-lg overflow-hidden w-fit">
                    <button
                        onClick={decrease}
                        className="px-3 py-1.5 hover:bg-gray-100"
                    >
                        -
                    </button>

                    <span className="px-4 py-1.5 border-x">{speed}</span>

                    <button
                        onClick={increase}
                        className="px-3 py-1.5 hover:bg-gray-100"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Stats */}
            {p && (
                <>
                    <div className="border-t pt-4 space-y-3 text-sm">

                        <StatRow label="Time" value={`${p.date} ${p.time}`} />

                        <StatRow
                            label="Ignition"
                            value={p.ignition ? "ON" : "OFF"}
                            valueClass={p.ignition ? "text-green-600 font-medium" : "text-red-500"}
                        />

                        <StatRow label="Signal Strength" value={`${p.signalStrength}%`} />

                        <StatRow label="Satellites" value={p.noOfSatellites} />

                        <StatRow
                            label="Speed"
                            value={`${p.speed} km/h`}
                            valueClass="text-blue-600 font-medium"
                        />

                    </div>

                    <div className="border-t pt-4 space-y-3 text-sm">
                        <StatRow label="Total Points" value={points.length} />

                        <StatRow label="Max Speed" value={`${maxSpeed} km/h`} />

                        <StatRow label="Max Speed" value={`Max Speed 0.00 Km/Hr 
                                                            Total Time 03 Hr : 21 Min
                                                            Running Time 00 Hr : 00 Min
                                                            Idle Time 03 Hr : 21 Min
                                                            Total Distance 0.00 Km
                                                        `} />
                    </div>
                </>

            )
            }

        </div >
    )
}

function StatRow({
    label,
    value,
    valueClass
}: {
    label: string
    value: any
    valueClass?: string
}) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    )
}
