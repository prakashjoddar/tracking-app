"use client"

import { StudentRequestResponse } from "@/lib/types"
import { useStudentStore } from "@/store/student-store"
import { Hash, BookOpen, CreditCard, Phone, MapPin, Edit2, Trash2, Mail, GraduationCap } from "lucide-react"
import { deleteStudent } from "@/lib/api"
import { toast } from "sonner"

interface StudentCardProps {
    student: StudentRequestResponse
    isEditing: boolean
    onEdit: () => void
}

export function StudentCard({ student, isEditing, onEdit }: StudentCardProps) {
    const { removeStudent } = useStudentStore()

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${student.firstName}?`)) return
        
        try {
            if (student.id) {
                await deleteStudent(student.id)
                removeStudent(student.id)
                toast.success("Student removed successfully")
            }
        } catch (e: any) {
            console.error("Delete failed:", e)
            const msg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : null) || e.message || "Failed to delete student"
            toast.error(msg)
        }
    }

    return (
        <div className={`border rounded-xl p-4 shadow-sm transition-all group
            ${isEditing ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20" : "bg-white hover:shadow-md hover:border-gray-300"}
        `}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0 group-hover:bg-blue-600 transition-colors">
                        <GraduationCap size={16} className="text-blue-600 group-hover:text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">Roll: {student.rollNo} • {student.standard}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Edit2 size={12} />
                        </button>
                        <button onClick={handleDelete} className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                            <Trash2 size={12} />
                        </button>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${student.rfid 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}>
                        {student.rfid ? "RFID" : "No ID"}
                    </span>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="p-1 bg-slate-100 rounded-md">
                        <Phone size={11} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-0.5">Parent</p>
                        <p className="truncate leading-none">{student.parents?.join(", ")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="p-1 bg-slate-100 rounded-md">
                        <Phone size={11} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-0.5">Student</p>
                        <p className="truncate leading-none">{student.mobileNo || "—"}</p>
                    </div>
                </div>
            </div>

            <div className="mt-2.5 space-y-1.5 pt-2.5 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors">
                    <Mail size={10} className="shrink-0" />
                    <span className="truncate">{student.email || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{student.address || "No address set"}</span>
                </div>
            </div>
        </div>
    )
}
