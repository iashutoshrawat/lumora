"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, LayoutDashboard, Plus, FolderOpen, Settings, X, BarChart3 } from "lucide-react"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Sidebar is expanded when hovered or manually expanded
  const isExpanded = isHovered || !isCollapsed

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "New Project", href: "/dashboard/upload", icon: Plus },
    { label: "My Projects", href: "/dashboard/projects", icon: FolderOpen },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${isOpen ? 'block' : 'hidden lg:block'} ${
          isExpanded ? 'w-60' : 'w-16'
        } bg-gradient-to-b from-gray-50 via-white to-gray-50 border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 ease-out`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Area */}
        <Link
          href="/"
          className="px-4 py-5 border-b border-gray-100 flex items-center justify-center"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={`w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                isHovered ? 'rotate-3 scale-105 shadow-lg shadow-blue-500/30' : ''
              }`}
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-lg font-semibold text-gray-900 whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
              }`}
            >
              Lumora
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-gray-900 before:absolute before:left-0 before:inset-y-1 before:w-1 before:bg-blue-600 before:rounded-r'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-blue-600' : 'group-hover:scale-110'
                  }`} />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className={`px-2 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-xs font-medium text-gray-900">Free Plan</div>
            <div className="text-xs text-gray-500 mt-0.5">3 of 10 projects used</div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: '30%' }}
              />
            </div>
          </div>

          {/* Collapsed state indicator */}
          {!isExpanded && (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
