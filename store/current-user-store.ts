import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { UserRequestResponse } from "@/lib/types";
import { fetchCurrentUser } from "@/lib/api";

type CurrentUserState = {
    user: UserRequestResponse | null;
    loading: boolean;
    fetched: boolean;
    fetchCurrentUserOnce: () => Promise<void>;
};

export const useCurrentUserStore = create<CurrentUserState>()(
    devtools((set, get) => ({
        user: null,
        loading: false,
        fetched: false,

        fetchCurrentUserOnce: async () => {
            if (get().fetched || get().loading) return;
            set({ loading: true });
            try {
                const user = await fetchCurrentUser();
                set({ user, fetched: true });
            } catch {
                set({ fetched: true });
            } finally {
                set({ loading: false });
            }
        },
    })),
);
