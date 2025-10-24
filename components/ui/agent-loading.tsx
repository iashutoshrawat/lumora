"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Brain, BarChart3, Palette, Lightbulb, RefreshCw } from "lucide-react"

interface Agent {
  id: string
  name: string
  description: string
  icon: any
  color: string
}

const agents: Agent[] = [
  {
    id: 'data-transformer',
    name: 'Data Transformer',
    description: 'Analyzing structure and reshaping data...',
    icon: RefreshCw,
    color: 'bg-cyan-500'
  },
  {
    id: 'chart-analyst',
    name: 'Chart Analyst',
    description: 'Recommending chart strategies...',
    icon: Brain,
    color: 'bg-blue-500'
  },
  {
    id: 'viz-strategist',
    name: 'Visualization Strategist',
    description: 'Selecting optimal chart type...',
    icon: BarChart3,
    color: 'bg-purple-500'
  },
  {
    id: 'design-consultant',
    name: 'Design Consultant',
    description: 'Applying professional styling...',
    icon: Palette,
    color: 'bg-pink-500'
  },
  {
    id: 'insight-narrator',
    name: 'Insight Narrator',
    description: 'Crafting insights and recommendations...',
    icon: Lightbulb,
    color: 'bg-green-500'
  }
]

interface AgentLoadingProps {
  currentAgentIndex?: number
  onComplete?: () => void
}

export default function AgentLoading({ currentAgentIndex = 0, onComplete }: AgentLoadingProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (currentAgentIndex >= 0) {
      setActiveIndex(currentAgentIndex)
    }
  }, [currentAgentIndex])

  useEffect(() => {
    if (activeIndex >= agents.length && onComplete) {
      setTimeout(onComplete, 500)
    }
  }, [activeIndex, onComplete])

  return (
    <div className="w-full max-w-2xl mx-auto p-8">
      {/* Main Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full mb-4 shadow-lg">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Generating Your Chart
        </h2>
        <p className="text-gray-600">
          Our AI agents are working together to create the perfect visualization
        </p>
      </div>

      {/* Agent Progress List */}
      <div className="space-y-4">
        {agents.map((agent, index) => {
          const Icon = agent.icon
          const isCompleted = index < activeIndex
          const isActive = index === activeIndex
          const isUpcoming = index > activeIndex

          return (
            <div
              key={agent.id}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-500 ${
                isActive
                  ? 'border-primary bg-primary/5 shadow-md scale-105'
                  : isCompleted
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Agent Icon */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500'
                    : isActive
                    ? agent.color
                    : 'bg-gray-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-white" />
                ) : isActive ? (
                  <Icon className="w-6 h-6 text-white animate-pulse" />
                ) : (
                  <Icon className="w-6 h-6 text-white opacity-50" />
                )}
              </div>

              {/* Agent Info */}
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    isUpcoming ? 'text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {agent.name}
                </h3>
                <p
                  className={`text-sm ${
                    isActive
                      ? 'text-primary font-medium'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {isCompleted
                    ? 'Complete ✓'
                    : isActive
                    ? agent.description
                    : 'Waiting...'}
                </p>
              </div>

              {/* Loading Spinner for Active */}
              {isActive && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round((activeIndex / agents.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 rounded-full"
            style={{ width: `${(activeIndex / agents.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Estimated Time */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {activeIndex >= agents.length
            ? 'Analysis complete! Preparing your chart...'
            : `Estimated time remaining: ${(agents.length - activeIndex) * 15}s`}
        </p>
      </div>
    </div>
  )
}
