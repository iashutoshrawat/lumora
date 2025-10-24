"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  icon?: React.ReactNode
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  icon
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm text-gray-800">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
