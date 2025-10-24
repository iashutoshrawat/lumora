"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BarChart3, Mail, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Mock login - in production, call your auth API
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify({ email }))
      router.push("/dashboard")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <Card className="w-full max-w-md bg-surface/80 backdrop-blur-lg p-6 border-2 border-border shadow-xl relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1.5">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome Back
          </span>
        </h1>
        <p className="text-muted-foreground text-center mb-6 text-sm">Log in to your Lumora account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-background"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <Link href="#" className="text-sm text-accent hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-background"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-muted-foreground text-xs">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <Button
          variant="outline"
          className="w-full border-2 hover:bg-accent/5 py-2.5 rounded-lg font-medium transition-all"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Don't have an account?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
