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
    const fetched = useCurrentUserStore((s) => s.fetched)
    const fetchCurrentUserOnce = useCurrentUserStore((s) => s.fetchCurrentUserOnce)
    const isSubOrg = userType === "SUB_ORG"
    useEffect(() => {
        if (isSubOrg) fetchCurrentUserOnce()
    }, [isSubOrg, fetchCurrentUserOnce])

    // Dashboard (and any path outside the gated menu set) is never itself gated — the safe
    // landing page, avoids any redirect loop.
    const menuKey = getMenuKeyForPath(pathname)
    const isGatedPath = menuKey !== null && menuKey !== "DASHBOARD"

    // Until the fetch resolves, we don't yet know this SUB_ORG's restrictions — rendering
    // children in the meantime would flash a gated page's contents before the redirect below
    // kicks in, and treating "not resolved yet" the same as "unrestricted" would grant full
    // access to anyone on a slow connection.
    const resolving = isSubOrg && isGatedPath && !fetched
    // The fetch completed but came back empty (network error, 401, etc) — fail closed rather
    // than open: if we can't confirm this SUB_ORG's allowedMenus, don't assume it has none.
    const fetchFailed = isSubOrg && fetched && !currentUser

    const allowedMenus = currentUser?.allowedMenus
    const isRestricted = isSubOrg && !!allowedMenus?.length
    const blocked = isGatedPath && isSubOrg && fetched && (fetchFailed || (isRestricted && !allowedMenus!.includes(menuKey)))

    useEffect(() => {
        if (blocked) router.replace("/")
    }, [blocked, router])

    if (blocked || resolving) return null

    return <>{children}</>
}
