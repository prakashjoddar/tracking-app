"use client"

import { useEffect, useState } from "react"
import { Geofence } from "@/lib/types"
import { useGeofenceStore } from "@/store/geofence-store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
    Search, Plus, X, ArrowUpDown, Check, 
    CalendarArrowDown, CalendarArrowUp, 
    ArrowDownAZ, ArrowUpAZ, Loader2, RefreshCw
} from "lucide-react"
import { 
    DropdownMenu, DropdownMenuContent, 
    DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { GeofenceCard } from "./GeofenceCard"
import { fetchGeofences } from "@/lib/api"
import { cn } from "@/lib/utils"

type SortField = "name" | "date"
type SortOrder = "asc" | "desc"

interface GeofenceListPanelProps {
    onAddNew: () => void
    onEdit: (id: string) => void
}

export function GeofenceListPanel({ onAddNew, onEdit }: GeofenceListPanelProps) {
    const { geofences, setGeofences, loading, setLoading, editingGeofenceId } = useGeofenceStore()
    const [search, setSearch] = useState("")
    const [sortField, setSortField] = useState<SortField>("name")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const loadData = async () => {
        try {
            setLoading(true)
            const data = await fetchGeofences()
            setGeofences(data)
        } catch (e) {
            console.error("Failed to fetch geofences:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filtered = geofences.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase()) ||
        g.address?.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
        if (sortField === "name") {
            return sortOrder === "asc" 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name)
        }
        return 0
    })

    return (
        <div className="flex flex-col h-full bg-white select-none">
            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-sm font-bold tracking-tight">Geofence Directory</h1>
                        <p className="text-[10px] text-gray-400 font-medium">Manage your virtual perimeters</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={loadData}
                            className="size-7 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        </Button>
                        <Button 
                            onClick={onAddNew}
                            className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                        >
                            <Plus size={12} className="mr-1" />
                            ADD FENCE
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search fences..." 
                            className="h-8 text-xs pl-8 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="size-8 shrink-0 text-gray-400">
                                <ArrowUpDown size={13} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="gap-2 text-xs">
                                <ArrowDownAZ size={13} />
                                <span>Name (A-Z)</span>
                                {sortField === "name" && sortOrder === "asc" && <Check size={12} className="ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("desc"); }} className="gap-2 text-xs">
                                <ArrowUpAZ size={13} />
                                <span>Name (Z-A)</span>
                                {sortField === "name" && sortOrder === "desc" && <Check size={12} className="ml-auto" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {loading && geofences.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Loader2 size={24} className="animate-spin text-blue-500/20" />
                        <p className="text-[11px] font-medium italic">Loading results...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map(geofence => (
                        <GeofenceCard 
                            key={geofence.id} 
                            geofence={geofence} 
                            isEditing={editingGeofenceId === geofence.id}
                            onEdit={() => onEdit(geofence.id!)} 
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="size-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                            <Search size={20} className="text-gray-200" />
                        </div>
                        <p className="text-xs font-semibold text-gray-600">No Fences Found</p>
                        <p className="text-[10px] text-gray-400 mt-1">Try adjusting your search or add a new one.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-2.5 border-t bg-gray-50/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    {filtered.length} Results
                </span>
                <div className="hidden sm:flex items-center gap-1.5">
                   <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[10px] text-gray-400 font-medium">Ready</span>
                </div>
            </div>
        </div>
    )
}
