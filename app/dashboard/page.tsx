"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Sidebar from "@/components/dashboard/sidebar"
import ProjectGrid from "@/components/dashboard/project-grid"
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  LogOut,
  Plus,
  Activity
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    } else {
      setUser(JSON.parse(userData))
    }
  }, [router])

  if (!user) return null

  const stats = [
    { label: "Total Projects", value: "3", icon: <BarChart3 className="w-5 h-5" />, color: "from-blue-500 to-cyan-500" },
    { label: "Charts Created", value: "12", icon: <Activity className="w-5 h-5" />, color: "from-purple-500 to-pink-500" },
    { label: "This Month", value: "+5", icon: <TrendingUp className="w-5 h-5" />, color: "from-green-500 to-emerald-500" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-0.5">Welcome back, {user.email.split('@')[0]}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/upload">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("user")
                router.push("/")
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <Card
                  key={i}
                  className="p-6 bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/dashboard/upload">
                <Card className="bg-white border border-gray-200 p-8 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Dataset</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Import CSV, Excel, or JSON files to start creating beautiful visualizations
                  </p>
                  <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                    Get started
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Card>
              </Link>

              <Link href="/dashboard/upload">
                <Card className="bg-white border border-gray-200 p-8 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Chart Builder</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Use natural language to describe your chart and let AI create it for you
                  </p>
                  <div className="text-sm font-medium text-purple-600 group-hover:text-purple-700 flex items-center gap-1">
                    Start creating
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Your latest chart creations</p>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    View All
                  </Button>
                </Link>
              </div>
              <ProjectGrid />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
