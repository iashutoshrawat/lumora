"use client"

import { Check, Loader2, RefreshCw, Brain, BarChart3, Palette, Lightbulb, AlertCircle } from "lucide-react"

type AgentStatus = 'running' | 'complete' | 'pending' | 'error'

interface AgentProgress {
  agentName: string
  status: AgentStatus
  description: string
}

interface AgentProgressMessageProps {
  agents: AgentProgress[]
}

const agentIcons: Record<string, any> = {
  'Data Transformer': RefreshCw,
  'Chart Analyst': Brain,
  'Visualization Strategist': BarChart3,
  'Design Consultant': Palette,
  'Insight Narrator': Lightbulb
}

const agentColors: Record<string, string> = {
  'Data Transformer': 'text-cyan-500',
  'Chart Analyst': 'text-blue-500',
  'Visualization Strategist': 'text-purple-500',
  'Design Consultant': 'text-pink-500',
  'Insight Narrator': 'text-green-500'
}

export default function AgentProgressMessage({ agents }: AgentProgressMessageProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 max-w-[85%]">
      <div className="space-y-2.5">
        {agents.map((agent, index) => {
          const Icon = agentIcons[agent.agentName] || Brain
          const colorClass = agentColors[agent.agentName] || 'text-gray-500'

          return (
            <div
              key={index}
              className={`flex items-center gap-3 ${
                agent.status === 'pending' ? 'opacity-40' : ''
              }`}
            >
              {/* Icon/Status */}
              <div className="flex-shrink-0">
                {agent.status === 'complete' ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : agent.status === 'running' ? (
                  <Loader2 className={`w-5 h-5 ${colorClass} animate-spin`} />
                ) : agent.status === 'error' ? (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  agent.status === 'complete'
                    ? 'text-green-700'
                    : agent.status === 'running'
                      ? 'text-gray-900'
                      : agent.status === 'error'
                        ? 'text-red-600'
                        : 'text-gray-500'
                }`}>
                  {agent.agentName}
                </p>
                <p className={`text-xs ${agent.status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
                  {agent.status === 'complete'
                    ? 'Complete'
                    : agent.status === 'error'
                      ? 'Failed — check logs for details'
                      : agent.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Status */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Overall Progress</span>
          <span>
            {agents.filter(a => a.status === 'complete').length} / {agents.length} complete
          </span>
        </div>
        <div className="mt-1.5 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 rounded-full"
            style={{
              width: `${(agents.filter(a => a.status === 'complete').length / agents.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
