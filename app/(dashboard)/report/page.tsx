import {
    Car,
    MapPinned,
    Zap,
    Route,
    MapPin,
    UserCheck,
    Gauge,
    Navigation,
    FileBarChart2,
    Milestone,
    CalendarRange,
    Signpost,
    AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export const metadata = {
    title: "Reports | Tracking Toe",
}

const reports = [
    {
        id: "vehicle",
        title: "Vehicle Report",
        description: "Overview of vehicle status, activity, and utilization.",
        icon: Car,
        color: "bg-blue-50 text-blue-600",
        border: "hover:border-blue-200",
        href: "/report/vehicle",
    },
    {
        id: "geofence",
        title: "Geofence Report",
        description: "Entry and exit events for defined geofence zones.",
        icon: MapPinned,
        color: "bg-purple-50 text-purple-600",
        border: "hover:border-purple-200",
        href: "/report/geofence",
    },
    {
        id: "distance",
        title: "Distance Report",
        description: "Total distance travelled per vehicle over a date range.",
        icon: Milestone,
        color: "bg-cyan-50 text-cyan-600",
        border: "hover:border-cyan-200",
        href: "/report/distance",
    },
    {
        id: "distance-daywise",
        title: "Day-wise Distance Report",
        description: "Distance travelled per vehicle, broken down by day.",
        icon: CalendarRange,
        color: "bg-pink-50 text-pink-600",
        border: "hover:border-pink-200",
        href: "/report/distance/daywise",
    },
    {
        id: "over-speed",
        title: "Over Speed Report",
        description: "Over-speed events with actual speed vs. the vehicle's limit.",
        icon: AlertTriangle,
        color: "bg-red-50 text-red-600",
        border: "hover:border-red-200",
        href: "/report/over-speed",
    },
    {
        id: "ignition",
        title: "Ignition Report",
        description: "Ignition on/off events with timestamps and duration.",
        icon: Zap,
        color: "bg-yellow-50 text-yellow-600",
        border: "hover:border-yellow-200",
        href: "/report/ignition",
    },
    {
        id: "trip",
        title: "Trip Report",
        description: "Detailed log of trips including distance and duration.",
        icon: Route,
        color: "bg-green-50 text-green-600",
        border: "hover:border-green-200",
        href: "/report/trip",
    },
    {
        id: "stops",
        title: "Stops Report",
        description: "All stop events with location, duration, and time.",
        icon: MapPin,
        color: "bg-orange-50 text-orange-600",
        border: "hover:border-orange-200",
        href: "/report/stops",
    },
    {
        id: "stop-distance",
        title: "Stop Distance Report",
        description: "Distance of each stop from the trip's starting location.",
        icon: Signpost,
        color: "bg-amber-50 text-amber-600",
        border: "hover:border-amber-200",
        href: "/report/stop-distance",
    },
    {
        id: "attendance",
        title: "Attendance Report",
        description: "Student or driver attendance records per trip.",
        icon: UserCheck,
        color: "bg-teal-50 text-teal-600",
        border: "hover:border-teal-200",
        href: "/report/attendance",
    },
    {
        id: "vehicle-performance",
        title: "Vehicle Performance",
        description: "Speed, fuel, and engine performance analytics.",
        icon: Gauge,
        color: "bg-indigo-50 text-indigo-600",
        border: "hover:border-indigo-200",
        href: "/report/vehicle-performance",
    },
    {
        id: "route-deviation",
        title: "Route Deviation",
        description: "Instances where vehicles deviated from assigned routes.",
        icon: Navigation,
        color: "bg-red-50 text-red-600",
        border: "hover:border-red-200",
        href: "/report/route-deviation",
    },
]

export default function ReportPage() {
    return (
        <div className="flex-1 h-[calc(100vh-2rem)] m-4 overflow-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                    <FileBarChart2 size={20} className="text-blue-600" />
                    <h1 className="text-xl font-bold text-slate-900">Reports</h1>
                </div>
                <p className="text-sm text-slate-500">Select a report to view detailed data and export options.</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {reports.map((report) => {
                    const Icon = report.icon
                    return (
                        <Link
                            key={report.id}
                            href={report.href}
                            className={`group flex flex-col gap-3 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md ${report.border} hover:-translate-y-0.5`}
                        >
                            <div className={`flex size-11 items-center justify-center rounded-xl ${report.color}`}>
                                <Icon size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                                    {report.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                    {report.description}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
