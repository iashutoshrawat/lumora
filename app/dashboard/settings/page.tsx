"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Sidebar from "@/components/dashboard/sidebar"

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [email, setEmail] = useState("user@example.com")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSaveProfile = () => {
    alert("Profile updated!")
  }

  const handleChangePassword = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    alert("Password changed!")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-surface border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Account Settings */}
            <Card className="bg-surface border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="bg-accent hover:bg-accent/90 text-white">
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="bg-surface border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button onClick={handleChangePassword} className="bg-accent hover:bg-accent/90 text-white">
                  Update Password
                </Button>
              </div>
            </Card>

            {/* Subscription */}
            <Card className="bg-surface border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-text mb-4">Subscription</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-text font-medium">Current Plan: Free Tier</p>
                  <p className="text-text-muted text-sm">Unlimited projects with basic features</p>
                </div>
                <Button className="bg-accent hover:bg-accent/90 text-white">Upgrade to Pro</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
