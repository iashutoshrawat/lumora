"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Sparkles, FileText } from "lucide-react"
import FileUploadButton from "./file-upload-button"
import AgentProgressMessage from "./agent-progress-message"

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'file' | 'agent-progress'
  metadata?: any
}

interface ChatInterfaceProps {
  selectedChartId: string | null
  onFileUpload: (data: any, fileName: string) => void
  onMessageSend: (message: string) => void
  messages: Message[]
  isProcessing: boolean
}

export default function ChatInterface({
  selectedChartId,
  onFileUpload,
  onMessageSend,
  messages,
  isProcessing
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    onMessageSend(input.trim())
    setInput("")
  }

  const quickActions = selectedChartId
    ? [
        { label: "Make bars wider", prompt: "Make the bars wider" },
        { label: "Add target line", prompt: "Add a target line at the average value" },
        { label: "Show data labels", prompt: "Show data labels on all points" },
        { label: "Change to blue theme", prompt: "Change the color scheme to professional blue tones" }
      ]
    : [
        { label: "Show trends over time", prompt: "Create a line chart showing trends over time" },
        { label: "Compare categories", prompt: "Create a bar chart comparing categories" },
        { label: "Show composition", prompt: "Create a pie chart showing composition" },
        { label: "Multiple charts", prompt: "Generate 3 different chart types to explore the data" }
      ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="text-base font-semibold text-gray-900">
            {selectedChartId ? 'Chart Editor' : 'AI Assistant'}
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          {selectedChartId
            ? 'Tell me how you\'d like to modify the selected chart'
            : 'Upload data to generate professional charts'}
        </p>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {selectedChartId ? 'Let\'s customize your chart!' : 'Let\'s create amazing charts!'}
            </p>
            <p className="text-xs text-gray-500">
              {selectedChartId
                ? 'Ask me to modify colors, add labels, change chart type, and more'
                : 'Upload a file using the paperclip icon to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'agent-progress' ? (
                  <AgentProgressMessage agents={msg.metadata?.agents || []} />
                ) : msg.type === 'file' ? (
                  <div className="max-w-[85%]">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900">
                          {msg.metadata?.fileName || 'File uploaded'}
                        </p>
                        <p className="text-xs text-blue-600">
                          {msg.metadata?.rowCount || 0} rows • {msg.metadata?.columnCount || 0} columns
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-accent to-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(action.prompt)
                }}
                disabled={isProcessing}
                className="px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <FileUploadButton
            onFileUpload={onFileUpload}
            disabled={isProcessing}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedChartId
                ? "Type your modification request..."
                : "Ask me to create a chart or upload data..."
            }
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm bg-white transition-all placeholder:text-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:cursor-not-allowed"
          >
            {isProcessing ? (
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
