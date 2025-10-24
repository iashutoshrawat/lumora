"use client"

import { useState } from "react"
import { Send, Sparkles, Loader2 } from "lucide-react"

interface ChartChatProps {
  data: any
  chartType: string
  onChartTypeChange: (type: string) => void
  onChartUpdate: (config: any) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChartChat({ data, chartType, onChartTypeChange, onChartUpdate }: ChartChatProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: "assistant",
      content: `I've created a ${chartType} chart for your data. Try saying "Change to line chart", "Make it colorful", or "Add a title" to customize it!`,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

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
        throw new Error(result.error)
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

  return (
    <div className="bg-surface h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-background">
        <Sparkles size={16} className="text-accent" />
        <h3 className="font-semibold text-foreground text-sm">AI Assistant</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg: Message) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-accent to-primary text-white rounded-br-none shadow-sm"
                  : "bg-muted text-foreground rounded-bl-none border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-3 py-2 rounded-lg text-xs bg-muted text-foreground rounded-bl-none border border-border flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="px-4 py-3 border-t border-border bg-background flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: 'Change to line chart' or 'Make it colorful'"
          className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs bg-surface transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          className="bg-gradient-to-r from-accent to-primary hover:opacity-90 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  )
}
