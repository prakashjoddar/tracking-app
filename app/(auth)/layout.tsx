import React from "react"
import { ShieldCheck, Truck } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 flex font-sans overflow-hidden selection:bg-blue-500/30">
            {/* Left side: Animated/Gradient Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-slate-900 border-r border-slate-800">
                {/* Background glowing orbs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" />
                    <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[100px]" />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                        <Truck size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Tracking Toe</span>
                </div>

                <div className="relative z-10 max-w-md">
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Intelligent fleet management for the modern enterprise.
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Track, manage, and optimize your entire fleet in real-time with our powerful dashboard and deep analytics.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500">
                    <ShieldCheck size={18} className="text-blue-500" />
                    <span>Bank-grade security & end-to-end encryption</span>
                </div>
            </div>

            {/* Right side: Forms */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
                {/* Mobile orb (visible on small screens) */}
                <div className="lg:hidden absolute top-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />
                
                <div className="w-full max-w-md relative z-10">
                    {children}
                </div>
            </div>
        </div>
    )
}
