"use client"

import { LucideIcon } from "lucide-react"

interface QuickActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export default function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-accent hover:bg-accent/5 transition-all duration-200 group shadow-sm hover:shadow"
    >
      <Icon className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" />
      <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
    </button>
  )
}
