import { create } from "zustand"
import { UserRequestResponse } from "@/lib/types"

type UserManageState = {
    users: UserRequestResponse[]
    loading: boolean
    editingUserId: string | null
    
    setUsers: (users: UserRequestResponse[]) => void
    addUser: (user: UserRequestResponse) => void
    updateUser: (id: string, updated: UserRequestResponse) => void
    deleteUser: (id: string) => void
    
    setLoading: (loading: boolean) => void
    setEditingUserId: (id: string | null) => void
}

export const useUserManageStore = create<UserManageState>((set) => ({
    users: [],
    loading: false,
    editingUserId: null,
    
    setUsers: (users) => set({ users }),
    addUser: (user) => set((s) => ({ users: [...s.users, user] })),
    updateUser: (id, updated) => set((s) => ({
        users: s.users.map((u) => (u.id === id ? updated : u))
    })),
    deleteUser: (id) => set((s) => ({
        users: s.users.filter((u) => u.id !== id)
    })),
    
    setLoading: (loading) => set({ loading }),
    setEditingUserId: (id) => set({ editingUserId: id })
}))
