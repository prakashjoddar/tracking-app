import { create } from "zustand"
import { StudentRequestResponse } from "@/lib/types"

interface StudentState {
  students: StudentRequestResponse[]
  loading: boolean
  editingStudentId: string | null
  
  setStudents: (students: StudentRequestResponse[]) => void
  addStudent: (student: StudentRequestResponse) => void
  updateStudent: (id: string, student: StudentRequestResponse) => void
  removeStudent: (id: string) => void
  setEditingStudent: (id: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  loading: false,
  editingStudentId: null,

  setStudents: (students) => set({ students }),
  addStudent: (student) => set((state) => ({ 
    students: [student, ...state.students] 
  })),
  updateStudent: (id, student) => set((state) => ({
    students: state.students.map((s) => (s.id === id ? student : s))
  })),
  removeStudent: (id) => set((state) => ({
    students: state.students.filter((s) => s.id !== id)
  })),
  setEditingStudent: (id) => set({ editingStudentId: id }),
  setLoading: (loading) => set({ loading }),
}))
