"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

interface AIChatProps {
  data: any
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AIChat({ data }: AIChatProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: "assistant",
      content: data
        ? "I've analyzed your data! Ask me about chart recommendations, data quality, or any insights you'd like."
        : "Hi! Upload your data and I can help you analyze it, suggest chart types, and identify any issues.",
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
      const response = await fetch('/api/chat/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          dataStructure: data ? {
            columns: data.columns || [],
            rowCount: data.rows?.length || 0
          } : null,
          sampleRows: data?.rows?.slice(0, 5) || []
        })
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
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
    <Card className="bg-surface border-2 border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2 bg-background">
        <Sparkles size={16} className="text-accent" />
        <h3 className="font-semibold text-foreground text-sm">Data Analysis AI</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: Message) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
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
            <div className="max-w-xs px-3 py-2 rounded-lg text-sm bg-muted text-foreground rounded-bl-none border border-border flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm bg-background"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </form>
      </div>
    </Card>
  )
}
