"use client"

import { Checkbox, Drawer, DrawerProps, Flex, Radio, TimePicker, Button as AntBtn } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { Input } from "../ui/input"
import { useRouter } from "next/navigation"
import { Bus, Clock, Users, MapPin, Save, RotateCcw, Search, ShieldCheck, CarFront, Phone, Check, Loader2 } from "lucide-react"
import { useTripStore } from "@/store/trip-store"
import { Trip, UserRequestResponse, WeekDay } from "@/lib/types"
import { saveTrip, saveStops, fetchUsers } from "@/lib/api"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const FORMAT = "HH:mm"

const toDisplay = (d: string) => d.charAt(0) + d.slice(1).toLowerCase()
const toBackend = (d: string) => d.toUpperCase() as WeekDay

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

type FormFieldProps = { label: string; children: React.ReactNode }
const FormField = ({ label, children }: FormFieldProps) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {children}
    </div>
)

export const waypoint = "ko{_CgtgaNN{KmGyLmFoU_Hcm@oJw|@sPuW}\\qOoYalAo`@uwB"

export default function TripForm() {

    const { editingTripId, trips, addTrip, updateTrip, setEditingTripId, selectedVehicleId, stops, setStops } = useTripStore()
    const editingTrip = trips.find(t => t.id === editingTripId) ?? null

    const [tripName, setTripName] = useState<string>("")
    const [tripType, setTripType] = useState<string>("PICKING")
    const [tripEnable, setTripEnable] = useState<boolean>(true)
    const [startTime, setStartTime] = useState<string>("06:00")
    const [endTime, setEndTime] = useState<string>("18:00")
    const [selectedDays, setSelectedDays] = useState<string[]>(
        DAYS.filter(d => d !== "Saturday" && d !== "Sunday")
    )

    // Driver selection
    const [driverDrawerOpen, setDriverDrawerOpen] = useState<boolean>(false)
    const [drivers, setDrivers] = useState<UserRequestResponse[]>([])
    const [driversLoading, setDriversLoading] = useState(false)
    const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])
    const [driverSearch, setDriverSearch] = useState("")

    // Supervisor selection
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [supervisors, setSupervisors] = useState<UserRequestResponse[]>([])
    const [supervisorsLoading, setSupervisorsLoading] = useState(false)
    const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<string[]>([])
    const [supervisorSearch, setSupervisorSearch] = useState("")

    const router = useRouter()

    useEffect(() => {
        if (editingTrip) {
            setTripName(editingTrip.name)
            setTripType(editingTrip.type)
            setTripEnable(editingTrip.enable)
            setStartTime(editingTrip.startTime)
            setEndTime(editingTrip.endTime)
            setSelectedDays(editingTrip.workingDay.map(toDisplay))
            setSelectedSupervisorIds(editingTrip.staff ?? [])
            setSelectedDriverIds(editingTrip.driver ?? [])
        } else {
            setTripName("")
            setTripType("PICKING")
            setTripEnable(true)
            setStartTime("06:00")
            setEndTime("18:00")
            setSelectedDays(DAYS.filter(d => d !== "Saturday" && d !== "Sunday"))
            setSelectedSupervisorIds([])
            setSelectedDriverIds([])
        }
    }, [editingTripId])

    // Load drivers when driver drawer opens
    useEffect(() => {
        if (!driverDrawerOpen) return
        if (drivers.length > 0) return
        const load = async () => {
            try {
                setDriversLoading(true)
                const data = await fetchUsers("DRIVER")
                setDrivers(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error("Failed to load drivers:", e)
            } finally {
                setDriversLoading(false)
            }
        }
        load()
    }, [driverDrawerOpen])

    // Load supervisors when drawer opens
    useEffect(() => {
        if (!drawerOpen) return
        if (supervisors.length > 0) return
        const load = async () => {
            try {
                setSupervisorsLoading(true)
                const data = await fetchUsers("SUPERVISOR")
                setSupervisors(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error("Failed to load supervisors:", e)
            } finally {
                setSupervisorsLoading(false)
            }
        }
        load()
    }, [drawerOpen])

    const types: CheckboxGroupProps<string>["options"] = [
        { label: "PICKING", value: "PICKING" },
        { label: "DROPPING", value: "DROPPING" },
    ]
    const states: CheckboxGroupProps<boolean>["options"] = [
        { label: "Enable", value: true },
        { label: "Disable", value: false },
    ]

    const stylesFn: DrawerProps["styles"] = (info) => {
        if (info.props.footer) return {
            header: { padding: 16 },
            body: { padding: 16 },
            footer: { padding: "10px", backgroundColor: "#fafafa" },
        }
        return {}
    }

    const resetForm = () => {
        setTripName("")
        setTripType("PICKING")
        setTripEnable(true)
        setStartTime("06:00")
        setEndTime("18:00")
        setSelectedDays(DAYS.filter(d => d !== "Saturday" && d !== "Sunday"))
        setSelectedSupervisorIds([])
        setSelectedDriverIds([])
    }

    const handleClear = () => {
        setEditingTripId(null)
        resetForm()
    }

    const handleSave = async (): Promise<void> => {
        try {
            const payload = {
                ...(editingTrip?.id ? { id: editingTrip.id } : {}),
                name: tripName,
                enable: tripEnable,
                type: tripType as Trip["type"],
                startTime,
                endTime,
                workingDay: selectedDays.map(toBackend),
                staff: selectedSupervisorIds,
                driver: selectedDriverIds,
                vehicleId: selectedVehicleId || "",
            }
            const saved = await saveTrip(payload)
            if (editingTrip) {
                updateTrip(saved.id, saved)
            } else {
                addTrip(saved)
            }

            if (stops.length > 0) {
                const stopPayload = stops.map((stop, index) => ({
                    ...(stop.id && !stop.id.startsWith("temp_") ? { id: stop.id } : {}),
                    name: stop.name,
                    enable: stop.enable,
                    type: stop.type,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    studentId: stop.studentId ?? [],
                    tripId: saved.id,
                    sequence: index + 1,
                }))
                const stopResults = await saveStops(stopPayload)
                setStops(stopResults.map(s => ({ ...s, snapToRoute: true })))
            }

            setEditingTripId(null)
            resetForm()
        } catch (e) {
            console.error("Save trip failed:", e)
        }
    }

    const filteredDrivers = drivers.filter(d => {
        const q = driverSearch.toLowerCase()
        return (
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
            (d.username || "").toLowerCase().includes(q) ||
            (d.mobileNo || "").toLowerCase().includes(q) ||
            (d.licenseNo || "").toLowerCase().includes(q)
        )
    })

    const filteredSupervisors = supervisors.filter(s => {
        const q = supervisorSearch.toLowerCase()
        return (
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
            (s.username || "").toLowerCase().includes(q) ||
            (s.mobileNo || "").toLowerCase().includes(q)
        )
    })

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-sm">
                        {editingTrip ? "Edit Trip" : "Create Trip"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {editingTrip
                            ? `Editing — ${editingTrip.name}`
                            : "Configure route details and schedule"
                        }
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                <Section icon={<Bus size={13} />} title="Trip Info">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Trip ID">
                            <Input disabled value={editingTrip?.id ?? ""} placeholder="Auto-generated" className="bg-gray-50 text-gray-400 font-mono text-xs" />
                        </FormField>
                        <FormField label="Trip Name">
                            <Input value={tripName} onChange={e => setTripName(e.target.value)} placeholder="e.g. Morning Route A" />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Trip Type">
                            <Radio.Group options={types} value={tripType} optionType="button" buttonStyle="solid" onChange={e => setTripType(e.target.value)} />
                        </FormField>
                        <FormField label="Status">
                            <Radio.Group options={states} value={tripEnable} optionType="button" buttonStyle="solid" onChange={e => setTripEnable(e.target.value)} />
                        </FormField>
                    </div>
                </Section>

                <Section icon={<Clock size={13} />} title="Schedule">
                    <FormField label="Trip Timings">
                        <div className="flex items-center gap-3">
                            <TimePicker placeholder="Start time" value={startTime ? dayjs(startTime, FORMAT) : null}
                                format={FORMAT} className="flex-1" needConfirm={false} onChange={(_, val) => setStartTime(val as string)} />
                            <span className="text-xs text-gray-400">to</span>
                            <TimePicker placeholder="End time" value={endTime ? dayjs(endTime, FORMAT) : null}
                                format={FORMAT} className="flex-1" needConfirm={false} onChange={(_, val) => setEndTime(val as string)} />
                        </div>
                    </FormField>
                    <FormField label="Working Days">
                        <Checkbox.Group options={DAYS} value={selectedDays}
                            onChange={vals => setSelectedDays(vals as string[])} className="flex flex-wrap gap-y-2" />
                    </FormField>
                </Section>

                <Section icon={<CarFront size={13} />} title="Drivers">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                        <div>
                            <p className="text-sm font-medium">Assigned Drivers</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {selectedDriverIds.length > 0
                                    ? `${selectedDriverIds.length} driver${selectedDriverIds.length > 1 ? "s" : ""} selected`
                                    : "No drivers assigned"
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setDriverDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CarFront size={12} />
                            Manage ({selectedDriverIds.length})
                        </button>
                    </div>
                </Section>

                <Section icon={<ShieldCheck size={13} />} title="Supervisors">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                        <div>
                            <p className="text-sm font-medium">Assigned Supervisors</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {selectedSupervisorIds.length > 0
                                    ? `${selectedSupervisorIds.length} supervisor${selectedSupervisorIds.length > 1 ? "s" : ""} selected`
                                    : "No supervisors assigned"
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Users size={12} />
                            Manage ({selectedSupervisorIds.length})
                        </button>
                    </div>
                </Section>

            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-2">
                <button onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors">
                    <RotateCcw size={13} />
                    Clear
                </button>
                <div className="flex gap-2">
                    <button onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <Save size={13} />
                        {editingTrip ? "Update Trip" : "Create Trip"}
                    </button>
                    {editingTrip && (
                        <button onClick={() => router.push("/trip/stop")}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
                            <MapPin size={13} />
                            Edit Stops
                        </button>
                    )}
                </div>
            </div>

            {/* Driver Drawer */}
            <Drawer
                size={440}
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                            <CarFront size={14} className="text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm leading-tight">Select Drivers</p>
                            <p className="text-[11px] text-gray-400 font-normal">{selectedDriverIds.length} selected</p>
                        </div>
                    </div>
                }
                styles={stylesFn}
                mask={{ enabled: true, blur: true }}
                open={driverDrawerOpen}
                onClose={() => setDriverDrawerOpen(false)}
                destroyOnHidden={false}
                footer={
                    <Flex justify="space-between" align="center">
                        <span className="text-xs text-gray-400">
                            {selectedDriverIds.length} of {drivers.length} selected
                        </span>
                        <Flex gap={8}>
                            <AntBtn size="middle" onClick={() => setSelectedDriverIds([])}
                                disabled={selectedDriverIds.length === 0}>
                                Clear All
                            </AntBtn>
                            <AntBtn type="primary" size="middle"
                                styles={{ root: { backgroundColor: "#16a34a" } }}
                                onClick={() => setDriverDrawerOpen(false)}>
                                Confirm
                            </AntBtn>
                        </Flex>
                    </Flex>
                }
            >
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 mb-4">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={driverSearch}
                        onChange={e => setDriverSearch(e.target.value)}
                        placeholder="Search by name, license..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>

                {driversLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <p className="text-xs">Loading drivers...</p>
                    </div>
                ) : drivers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <CarFront size={24} />
                        <p className="text-xs">No drivers found</p>
                        <p className="text-[11px] text-center text-gray-300">Add drivers from the Driver &amp; Supervisor page first.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredDrivers.map(driver => {
                            const did = driver.id ?? ""
                            const isSelected = !!did && selectedDriverIds.includes(did)
                            const toggle = () => {
                                if (!did) return
                                setSelectedDriverIds(prev =>
                                    isSelected ? prev.filter(id => id !== did) : [...prev, did]
                                )
                            }
                            return (
                                <div
                                    key={driver.id}
                                    onClick={toggle}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                        ${isSelected
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                                        ${isSelected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                        {isSelected ? <Check size={14} /> : (driver.firstName?.[0] ?? "D").toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {driver.firstName} {driver.lastName}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                                            {driver.licenseNo ? `License: ${driver.licenseNo}` : `@${driver.username}`}
                                        </p>
                                    </div>
                                    {driver.mobileNo && (
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                                            <Phone size={10} />
                                            <span>{driver.mobileNo}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Drawer>

            {/* Supervisor Drawer */}
            <Drawer
                size={440}
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <ShieldCheck size={14} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm leading-tight">Select Supervisors</p>
                            <p className="text-[11px] text-gray-400 font-normal">{selectedSupervisorIds.length} selected</p>
                        </div>
                    </div>
                }
                styles={stylesFn}
                mask={{ enabled: true, blur: true }}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                destroyOnHidden={false}
                footer={
                    <Flex justify="space-between" align="center">
                        <span className="text-xs text-gray-400">
                            {selectedSupervisorIds.length} of {supervisors.length} selected
                        </span>
                        <Flex gap={8}>
                            <AntBtn size="middle" onClick={() => setSelectedSupervisorIds([])}
                                disabled={selectedSupervisorIds.length === 0}>
                                Clear All
                            </AntBtn>
                            <AntBtn type="primary" size="middle"
                                styles={{ root: { backgroundColor: "#2563eb" } }}
                                onClick={() => setDrawerOpen(false)}>
                                Confirm
                            </AntBtn>
                        </Flex>
                    </Flex>
                }
            >
                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 mb-4">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                        value={supervisorSearch}
                        onChange={e => setSupervisorSearch(e.target.value)}
                        placeholder="Search by name, username..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                    />
                </div>

                {supervisorsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <p className="text-xs">Loading supervisors...</p>
                    </div>
                ) : supervisors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <ShieldCheck size={24} />
                        <p className="text-xs">No supervisors found</p>
                        <p className="text-[11px] text-center text-gray-300">Add supervisors from the Driver &amp; Supervisor page first.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredSupervisors.map(supervisor => {
                            const sid = supervisor.id ?? ""
                            const isSelected = !!sid && selectedSupervisorIds.includes(sid)
                            const toggle = () => {
                                if (!sid) return
                                setSelectedSupervisorIds(prev =>
                                    isSelected ? prev.filter(id => id !== sid) : [...prev, sid]
                                )
                            }
                            return (
                                <div
                                    key={supervisor.id}
                                    onClick={toggle}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                        ${isSelected
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                                        ${isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                        {isSelected
                                            ? <Check size={14} />
                                            : (supervisor.firstName?.[0] ?? "S").toUpperCase()
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {supervisor.firstName} {supervisor.lastName}
                                        </p>
                                        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                                            @{supervisor.username}
                                        </p>
                                    </div>

                                    {/* Phone */}
                                    {supervisor.mobileNo && (
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                                            <Phone size={10} />
                                            <span>{supervisor.mobileNo}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Drawer>
        </div>
    )
}
