"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import { BarChart3, LineChart, PieChart, MoreVertical, Clock, Plus } from "lucide-react"
import Link from "next/link"

export default function ProjectGrid() {
  const projects = [
    {
      id: 1,
      name: "Q4 Sales Analysis",
      type: "bar",
      thumbnail: "/bar-chart-sales.png",
      modified: "2 hours ago",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      name: "Market Share Trends",
      type: "pie",
      thumbnail: "/pie-chart-market-segments.png",
      modified: "1 day ago",
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      name: "Revenue Forecast",
      type: "line",
      thumbnail: "/line-chart-revenue-trends.jpg",
      modified: "3 days ago",
      color: "from-green-500 to-emerald-500"
    },
  ]

  const getChartIcon = (type: string) => {
    switch(type) {
      case "bar": return <BarChart3 className="w-4 h-4" />
      case "line": return <LineChart className="w-4 h-4" />
      case "pie": return <PieChart className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-16 h-16" />}
        title="No projects yet"
        description="Create your first chart project to get started with Lumora"
        action={
          <Link href="/dashboard/upload">
            <Button className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="bg-surface border-2 border-border overflow-hidden hover:border-accent/50 hover:shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
        >
          <div className="aspect-video bg-gradient-to-br from-muted to-background overflow-hidden relative">
            <img
              src={project.thumbnail || "/placeholder.svg"}
              alt={project.name}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              onError={(e) => {
                // Fallback gradient if image fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Fallback gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-20 -z-10`}></div>

            {/* Chart type badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 text-xs font-medium text-foreground border border-border">
              {getChartIcon(project.type)}
              <span className="capitalize">{project.type}</span>
            </div>

            {/* Actions menu */}
            <button className="absolute top-3 right-3 w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-border hover:bg-background">
              <MoreVertical className="w-4 h-4 text-foreground" />
            </button>
          </div>

          <div className="p-5">
            <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Modified {project.modified}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
