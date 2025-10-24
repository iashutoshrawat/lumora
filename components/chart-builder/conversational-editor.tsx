"use client"

import { useState } from "react"
import { Send, Loader2, Sparkles } from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ConversationalEditorProps {
  currentConfig: any
  onConfigUpdate: (newConfig: any) => void
}

export default function ConversationalEditor({
  currentConfig,
  onConfigUpdate
}: ConversationalEditorProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const quickActions = [
    { label: "Make bars wider", prompt: "Make the bars wider" },
    { label: "Add target line", prompt: "Add a target line at the average value" },
    { label: "Show data labels", prompt: "Show data labels on all points" },
    { label: "Change to blue theme", prompt: "Change the color scheme to professional blue tones" },
    { label: "Hide legend", prompt: "Hide the legend" },
    { label: "Bigger font", prompt: "Make all text larger and more readable" }
  ]

  const handleSubmit = async (customPrompt?: string) => {
    const messageText = customPrompt || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chart/edit-highcharts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentConfig,
          userRequest: messageText,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update the chart config
        onConfigUpdate(result.modifiedConfig)

        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.assistantMessage || 'Chart updated successfully!'
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(result.error || 'Failed to update chart')
      }
    } catch (error) {
      console.error('Chart editing error:', error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't update the chart: ${error instanceof Error ? error.message : 'Unknown error'}`
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="text-base font-semibold text-gray-900">
            Conversational Editor
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Tell me how you'd like to modify the chart
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
              Let's customize your chart!
            </p>
            <p className="text-xs text-gray-500">
              Try a quick action below or type your own request
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-accent to-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span className="text-sm text-gray-600">Updating chart...</span>
                </div>
              </div>
            )}
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
                onClick={() => handleSubmit(action.prompt)}
                disabled={isLoading}
                className="px-3 py-2 text-xs text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
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
            placeholder="Type your modification request..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm bg-white transition-all placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:cursor-not-allowed"
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
