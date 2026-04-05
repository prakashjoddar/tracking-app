"use client"

import { useEffect, useState } from "react"
import { useStudentStore } from "@/store/student-store"
import { StudentCard } from "./StudentCard"
import { fetchStudents } from "@/lib/api"
import { Search, RefreshCw, Plus, GraduationCap, Loader2, ArrowUpDown, SortAsc, SortDesc, Filter } from "lucide-react"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortField = "name" | "rollNo"
type SortOrder = "asc" | "desc"

interface StudentListPanelProps {
    onAdd: () => void
    onEdit: (id: string) => void
    isEditing?: boolean
}

export function StudentListPanel({ onAdd, onEdit, isEditing = false }: StudentListPanelProps) {
    const { students, setStudents, loading, setLoading, editingStudentId } = useStudentStore()
    const [search, setSearch] = useState("")
    const [sortField, setSortField] = useState<SortField>("name")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const loadStudents = async () => {
        try {
            setLoading(true)
            const data = await fetchStudents()
            setStudents(data)
        } catch (e) {
            toast.error("Failed to load student directory")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStudents()
    }, [])

    const filtered = students.filter(s => 
        s.firstName.toLowerCase().includes(search.toLowerCase()) || 
        s.lastName.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNo.includes(search) ||
        s.standard.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
        let comparison = 0
        if (sortField === "name") {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
            comparison = nameA.localeCompare(nameB)
        } else if (sortField === "rollNo") {
            // Attempt numeric sort, fallback to string
            const numA = parseInt(a.rollNo)
            const numB = parseInt(b.rollNo)
            if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB
            } else {
                comparison = a.rollNo.localeCompare(b.rollNo)
            }
        }
        return sortOrder === "asc" ? comparison : -comparison
    })

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <GraduationCap size={16} className="text-blue-600" />
                            Students
                        </h2>
                        <p className="text-xs text-gray-400">{students.length} enrolled</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors text-gray-500"
                                    title="Sort"
                                >
                                    <ArrowUpDown size={14} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
                                <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Sort Directory</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("asc"); }} className="text-xs py-2">
                                    <SortAsc size={14} className="mr-2 text-slate-400" />
                                    <span>Name (A-Z)</span>
                                    {sortField === "name" && sortOrder === "asc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("desc"); }} className="text-xs py-2">
                                    <SortDesc size={14} className="mr-2 text-slate-400" />
                                    <span>Name (Z-A)</span>
                                    {sortField === "name" && sortOrder === "desc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSortField("rollNo"); setSortOrder("asc"); }} className="text-xs py-2">
                                    <SortAsc size={14} className="mr-2 text-slate-400" />
                                    <span>Roll No (Asc)</span>
                                    {sortField === "rollNo" && sortOrder === "asc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortField("rollNo"); setSortOrder("desc"); }} className="text-xs py-2">
                                    <SortDesc size={14} className="mr-2 text-slate-400" />
                                    <span>Roll No (Desc)</span>
                                    {sortField === "rollNo" && sortOrder === "desc" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={loadStudents}
                            className="p-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-500"} />
                        </button>
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus size={13} />
                            Add Student
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                    <Search size={13} className="text-gray-400 shrink-0 group-focus-within:text-blue-500" />
                    <input
                        type="search"
                        placeholder="Search by name, roll, class..."
                        className="text-xs bg-transparent outline-none w-full placeholder:text-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-slate-50/30">
                {loading && students.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p className="font-medium">Fetching records...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className={`grid gap-6 grid-cols-1 ${isEditing ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                        {filtered.map(student => (
                            <StudentCard 
                                key={student.id} 
                                student={student} 
                                isEditing={editingStudentId === student.id}
                                onEdit={() => onEdit(student.id!)} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
                            <Search className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No students found</h3>
                        <p className="text-slate-500 max-w-xs mt-1">Try adjusting your search or add a new student to the platform.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
