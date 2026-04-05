"use client"

import { useState } from "react"
import { StudentListPanel } from "./StudentListPanel"
import { StudentForm } from "./StudentForm"
import { useStudentStore } from "@/store/student-store"

export default function StudentPanel() {
    const { setEditingStudent } = useStudentStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formMode, setFormMode] = useState<"add" | "edit">("add")

    const handleAdd = () => {
        setEditingStudent(null)
        setFormMode("add")
        setIsFormOpen(true)
    }

    const handleEdit = (id: string) => {
        setEditingStudent(id)
        setFormMode("edit")
        setIsFormOpen(true)
    }

    const handleClose = () => {
        setIsFormOpen(false)
    }

    return (
        <div className="h-full flex overflow-hidden bg-white">
            <div className={`flex-1 transition-all duration-500 ${isFormOpen ? 'pr-0 lg:pr-[640px]' : ''}`}>
                <StudentListPanel onAdd={handleAdd} onEdit={handleEdit} isEditing={isFormOpen} />
            </div>

            {/* Side Panel Overlay/Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full lg:w-[640px] transform ${isFormOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500 ease-in-out z-50 p-4`}>
                <div className="h-full shadow-2xl shadow-blue-900/10">
                    <StudentForm mode={formMode} onClose={handleClose} />
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={handleClose} />
            )}
        </div>
    )
}
