import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Auth routes don't need authentication to view
    const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
    
    // Check for tokens
    const accessToken = request.cookies.get("access_token")
    
    // 1. If trying to access an auth route while already logged in -> Go to default dashboard
    if (isAuthRoute && accessToken) {
        return NextResponse.redirect(new URL("/", request.url))
    }



    // 3. If trying to access ANY other route while NOT logged in -> Go to login
    if (!accessToken && !isAuthRoute) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
