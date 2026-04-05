"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Phone, MapPin } from "lucide-react"
import { registerAction } from "@/lib/auth-actions"
import { toast } from "sonner"

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const firstName = formData.get("firstName") as string
        const lastName = formData.get("lastName") as string
        const email = formData.get("email") as string
        const mobileNo = formData.get("mobileNo") as string
        const username = formData.get("username") as string
        const address = formData.get("address") as string
        const password = formData.get("password") as string
        const confirm = formData.get("confirmPassword") as string

        if (password !== confirm) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const res = await registerAction(firstName, lastName, email, mobileNo, username, password, address)
            if (res.success) {
                router.push("/")
            } else {
                const msg = res.error || "Registration failed"
                setError(msg)
                toast.error(msg)
                setIsLoading(false)
            }
        } catch {
            const msg = "An unexpected error occurred."
            setError(msg)
            toast.error(msg)
            setIsLoading(false)
        }
    }

    const inputClass = "w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Create an account</h2>
                <p className="text-slate-400">Join Tracking Toe to start managing your fleet efficiently.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">First Name <span className="text-red-400">*</span></label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input name="firstName" type="text" required placeholder="John" className={inputClass} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Last Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input name="lastName" type="text" placeholder="Doe" className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Email address <span className="text-red-400">*</span></label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                            <input name="email" type="email" required placeholder="name@company.com" className={inputClass} />
                        </div>
                    </div>

                    {/* Mobile & Username */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Mobile Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input name="mobileNo" type="tel" placeholder="+91 98765 43210" className={inputClass} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Username <span className="text-red-400">*</span></label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input name="username" type="text" required placeholder="john_org" className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Address</label>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                            <input name="address" type="text" placeholder="123 Main St, City" className={inputClass} />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Password <span className="text-red-400">*</span></label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Confirm Password <span className="text-red-400">*</span></label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    name="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none">
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full group relative flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        <>
                            <span>Register</span>
                            <ArrowRight className="w-4 h-4 absolute right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </>
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                    Sign in here
                </Link>
            </p>
        </div>
    )
}
