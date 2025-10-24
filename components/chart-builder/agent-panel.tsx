"use client"

import { useMemo, useState } from "react"
import { Sparkles, Send, Loader2, Lightbulb, Palette, BarChart3, Download, X, Bug } from "lucide-react"
import CollapsibleSection from "@/components/ui/collapsible-section"
import QuickActionButton from "@/components/ui/quick-action-button"
import { parseChartSpecifications } from "@/lib/utils/chart-spec-parser"
import type { ChartPlan, AnalystRecommendation } from "@/lib/utils/chart-plan"

interface AgentPanelProps {
  agentResults: any
  chartType: string
  onChartTypeChange: (type: string) => void
  onChartUpdate: (config: any) => void
  data: any
  chartPlan?: ChartPlan | null
  recommendations?: AnalystRecommendation[]
  selectedRecommendationId?: string | null
  onRecommendationSelect?: (id: string) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AgentPanel({
  agentResults,
  chartType,
  onChartTypeChange,
  onChartUpdate,
  data,
  chartPlan,
  recommendations = [],
  selectedRecommendationId,
  onRecommendationSelect
}: AgentPanelProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showChatHistory, setShowChatHistory] = useState(false)

  const parsedChartSpec = useMemo(() => {
    if (chartPlan?.chartSpec) return chartPlan.chartSpec
    if (!agentResults) return null

    try {
      return parseChartSpecifications(agentResults)
    } catch (error) {
      console.error('Failed to parse chart specification:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [agentResults, chartPlan])

  const handleQuickAction = async (action: string) => {
    setInput(action)
    await handleSubmit(action)
  }

  const handleSubmit = async (customInput?: string) => {
    const messageText = customInput || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowChatHistory(true)

    try {
      const response = await fetch('/api/chat/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          chartType,
          chartConfig: {},
          dataStructure: {
            columns: data?.columns || [],
            rowCount: data?.rows?.length || 0
          }
        })
      })

      const result = await response.json()

      if (result.error) {
        const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error
        throw new Error(errorMsg)
      }

      // Handle tool calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        result.toolCalls.forEach((toolCall: any) => {
          if (toolCall.toolName === 'changeChartType') {
            onChartTypeChange(toolCall.args.chartType)
          } else if (toolCall.toolName === 'updateChartColors') {
            onChartUpdate({ colors: toolCall.args.colors })
          } else if (toolCall.toolName === 'updateChartTitle') {
            onChartUpdate({ title: toolCall.args.title, subtitle: toolCall.args.subtitle })
          } else if (toolCall.toolName === 'adjustChartSettings') {
            onChartUpdate(toolCall.args)
          }
        })
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getQuickActions = () => {
    const actions = []

    if (chartType === 'bar') {
      actions.push({ icon: BarChart3, label: 'Change to line chart', action: 'Change this to a line chart' })
    } else if (chartType === 'line') {
      actions.push({ icon: BarChart3, label: 'Change to bar chart', action: 'Change this to a bar chart' })
    }

    actions.push(
      { icon: Palette, label: 'Apply McKinsey theme', action: 'Apply McKinsey consulting theme with navy and teal colors' },
      { icon: Lightbulb, label: 'Add data labels', action: 'Add data labels to the chart' },
      { icon: Download, label: 'Optimize for export', action: 'Optimize this chart for export and presentation' }
    )

    return actions
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-base font-semibold text-gray-900">Agent</h2>
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-semibold rounded-full uppercase tracking-wide">
              Beta
            </span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([])
                setShowChatHistory(false)
              }}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600">
          Your AI assistant for chart customization
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Illustration/Icon */}
        <div className="px-6 py-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="w-full aspect-[4/3] bg-white rounded-xl shadow-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">Ready to help!</p>
              <p className="text-xs text-gray-500 mt-1">Ask me anything about your chart</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-2">
            {getQuickActions().map((action, index) => (
              <QuickActionButton
                key={index}
                icon={action.icon}
                label={action.label}
                onClick={() => handleQuickAction(action.action)}
              />
            ))}
          </div>
        </div>

        {/* AI Insights (Collapsible) */}
        {agentResults && (
          <div className="bg-white mt-2">
            <CollapsibleSection
              title="AI Insights"
              defaultOpen={true}
              icon={<Lightbulb className="w-4 h-4 text-yellow-500" />}
            >
              <div className="space-y-4 text-sm">
                {/* Data Insights */}
                {agentResults.summary?.dataInsights && agentResults.summary.dataInsights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Key Findings
                    </h4>
                    <ul className="space-y-1.5">
                      {agentResults.summary.dataInsights.slice(0, 3).map((insight: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-accent mt-0.5">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {agentResults.summary?.narrative && agentResults.summary.narrative.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1.5">
                      {agentResults.summary.narrative.slice(0, 2).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-accent mt-0.5">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="bg-white mt-2">
            <CollapsibleSection
              title="Chart Strategy"
              defaultOpen={true}
              icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
            >
              <div className="space-y-2">
                {recommendations.map((rec) => {
                  const isSelected = rec.id === selectedRecommendationId
                  return (
                    <button
                      key={rec.id}
                      onClick={() => onRecommendationSelect?.(rec.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-transparent bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold uppercase tracking-wide text-[10px]">Priority {rec.priority}</span>
                        <span className="text-[10px] text-gray-500">{rec.insightType || rec.chartVariant || rec.chartType}</span>
                      </div>
                      <p className="text-[12px] font-medium text-gray-800 mb-0.5">
                        {rec.chartType}
                      </p>
                      {rec.businessQuestion && (
                        <p className="text-[11px] text-gray-500 line-clamp-2">
                          {rec.businessQuestion}
                        </p>
                      )}
                    </button>
                  )
                })}

                {chartPlan && (
                  <div className="text-[11px] text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                    <p className="font-semibold text-gray-700 mb-1">Active Plan</p>
                    <p>Chart: <span className="font-medium text-gray-800">{chartPlan.chartType}</span></p>
                    <p>X Axis: <span className="font-medium text-gray-800">{chartPlan.xKey}</span></p>
                    <p>Series: <span className="font-medium text-gray-800">{chartPlan.series.map((s) => s.label || s.key).join(", ")}</span></p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Debug: Raw agent outputs and parsed chart spec */}
        {agentResults && (
          <div className="bg-white mt-2">
            <CollapsibleSection
              title="Debug: Agent Outputs"
              defaultOpen={false}
              icon={<Bug className="w-4 h-4 text-red-500" />}
            >
              <div className="space-y-4 text-xs text-gray-700">
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Transformation Summary
                  </h4>
                  <pre className="bg-gray-900 text-gray-100 text-[11px] leading-relaxed p-3 rounded-lg whitespace-pre-wrap break-words">{JSON.stringify(agentResults.transformation, null, 2)}</pre>
                </div>
                {chartPlan && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Chart Plan
                    </h4>
                    <pre className="bg-gray-900 text-gray-100 text-[11px] leading-relaxed p-3 rounded-lg whitespace-pre-wrap break-words">{JSON.stringify(chartPlan, null, 2)}</pre>
                  </div>
                )}
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Parsed Chart Specification
                  </h4>
                  <pre className="bg-gray-900 text-gray-100 text-[11px] leading-relaxed p-3 rounded-lg whitespace-pre-wrap break-words">{JSON.stringify(parsedChartSpec, null, 2)}</pre>
                </div>
                <div className="space-y-3">
                  {Object.entries(agentResults.agents || {}).map(([agentKey, agentValue]: [string, any]) => (
                    <div key={agentKey}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          {agentKey.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <span className="text-[10px] text-gray-400">{agentValue?.role}</span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-[11px] leading-relaxed p-3 rounded-lg whitespace-pre-wrap break-words overflow-auto max-h-56">{agentValue?.output || 'No output'}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Chat History (if exists) */}
        {showChatHistory && messages.length > 0 && (
          <div className="bg-white mt-2 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Conversation
              </h3>
              <button
                onClick={() => setShowChatHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {messages.slice(-3).map((msg: Message) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-accent to-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Input (Sticky Bottom) */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to edit, create, or style anything"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm bg-white transition-all placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
