"use server"

import { cookies } from "next/headers"
import { serverApi as api } from "@/lib/api"

export async function loginAction(email: string, password?: string) {
    try {
        const cookieStore = await cookies()
        let deviceId = cookieStore.get("x_device_id")?.value

        if (!deviceId) {
            deviceId = crypto.randomUUID()
            cookieStore.set("x_device_id", deviceId, { httpOnly: false, secure: process.env.NODE_ENV === "production" })
        }

        // Use the axios instance
        const res = await api.post("/auth/login",
            { email, password },
            { headers: { "X-Device-Id": deviceId } }
        )

        const data = res.data
        console.log("📥 Login Response Data:", data)

        // Accommodate variations (access vs accessToken)
        const accessToken = data.access || data.accessToken || data.access_token || data.token
        const refreshToken = data.refresh || data.refreshToken || data.refresh_token

        if (accessToken && refreshToken) {
            cookieStore.set("access_token", accessToken, {
                httpOnly: false, // false so client can read it
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 // 1 day
            })
            cookieStore.set("refresh_token", refreshToken, {
                httpOnly: true, // keep refresh token secure
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            })

            return { success: true }
        }

        console.error("❌ Invalid token response payload:", data)
        return { success: false, error: "Invalid token response" }
    } catch (e: any) {
        console.error("Login Error:", e?.response?.data || e?.message || e)
        const errMsg = e?.response?.data?.message || e?.response?.data?.error || "Invalid credentials provided."
        return { success: false, error: errMsg }
    }
}

export async function registerAction(
    firstName: string,
    lastName: string,
    email: string,
    mobileNo: string,
    username: string,
    password: string,
    address: string,
) {
    try {
        await api.post("/auth/register", {
            firstName,
            lastName,
            email,
            mobileNo,
            username,
            password,
            type: "ORG",
            address,
        })
        // Auto-login after successful registration
        return await loginAction(email, password)
    } catch (e: any) {
        console.error("Register Error:", e)
        const errMsg = e?.response?.data?.message || e?.response?.data?.error || "Registration failed."
        return { success: false, error: errMsg }
    }
}

export async function logoutAction() {
    try {
        const cookieStore = await cookies()
        const access = cookieStore.get("access_token")?.value
        const deviceId = cookieStore.get("x_device_id")?.value

        if (access && deviceId) {
            await api.post("/auth/logout", null, {
                headers: {
                    "Authorization": `Bearer ${access}`,
                    "X-Device-Id": deviceId
                }
            })
        }
    } catch (e) {
        console.error("Logout Error:", e)
    } finally {
        // Clear cookies regardless
        const cookieStore = await cookies()
        cookieStore.delete("access_token")
        cookieStore.delete("refresh_token")
        cookieStore.delete("x_device_id")
    }
}

export async function refreshTokensAction() {
    try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get("refresh_token")?.value
        const deviceId = cookieStore.get("x_device_id")?.value

        if (!refreshToken || !deviceId) {
            return { success: false, error: "No refresh token available" }
        }

        const res = await api.post("/auth/refresh",
            { refreshToken },
            { headers: { "X-Device-Id": deviceId } }
        )

        const data = res.data
        const newAccessToken = data.access || data.accessToken || data.access_token || data.token
        const newRefreshToken = data.refresh || data.refreshToken || data.refresh_token

        if (newAccessToken && newRefreshToken) {
            cookieStore.set("access_token", newAccessToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 // 1 day
            })
            cookieStore.set("refresh_token", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 7 days
            })
            return { success: true, accessToken: newAccessToken }
        }

        return { success: false, error: "Invalid refresh token response shape" }
    } catch (e) {
        console.error("Refresh Tokens Error:", e)
        // Clear cookies on total refresh failure to prevent redirect loops
        const cookieStore = await cookies()
        cookieStore.delete("access_token")
        cookieStore.delete("refresh_token")
        return { success: false, error: "Network error during refresh" }
    }
}
