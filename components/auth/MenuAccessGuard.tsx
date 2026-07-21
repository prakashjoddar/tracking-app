"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUserType } from "@/lib/utils"
import { getMenuKeyForPath } from "@/lib/menu-items"
import { useCurrentUserStore } from "@/store/current-user-store"
import type { UserType } from "@/lib/types"

export function MenuAccessGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    const [userType, setUserType] = useState<UserType | null>(null)
    useEffect(() => {
        setUserType(getCurrentUserType())
    }, [])

    const currentUser = useCurrentUserStore((s) => s.user)
    const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce)
    useEffect(() => {
        if (userType === "SUB_ORG") fetchCurrentUserOnce()
    }, [userType, fetchCurrentUserOnce])

    const allowedMenus = currentUser?.allowedMenus
    const isRestricted = userType === "SUB_ORG" && !!allowedMenus?.length

    // Dashboard is never itself gated — the safe landing page, avoids any redirect loop.
    const menuKey = getMenuKeyForPath(pathname)
    const blocked = isRestricted && menuKey !== null && menuKey !== "DASHBOARD" && !allowedMenus!.includes(menuKey)

    useEffect(() => {
        if (blocked) router.replace("/")
    }, [blocked, router])

    if (blocked) return null

    return <>{children}</>
}
