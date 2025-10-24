"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar"
import ChartGallery from "@/components/chart-builder/chart-gallery"
import ChatInterface from "@/components/chat/chat-interface"
import { extractChartRecommendations, type AnalystRecommendation } from "@/lib/utils/chart-plan"
import { prepareDataForRecommendation } from "@/lib/utils/recommendation-data-preparer"
import { parseChartSpecifications, type ChartSpecification } from "@/lib/utils/chart-spec-parser"
import {
  deriveDesignFromChartSpec,
  deriveVizStrategyFromChartSpec,
  deepMerge,
  type DesignSpec,
  type VizStrategySpec
} from "@/lib/utils/chart-spec-adapter"
import { vizStrategistOutputSchema, designConsultantOutputSchema } from "@/lib/schemas/agent-output-schemas"
import { parseAndValidateAgentOutput } from "@/lib/utils/agent-retry"

const DEFAULT_COLORS = ["#004B87", "#0066B3", "#003366", "#0FA3B1", "#7209B7"]

interface Chart {
  id: string
  title: string
  type: string
  highchartsConfig: any
  createdAt: Date
  metadata?: any
}

type AgentStatus = 'pending' | 'running' | 'complete' | 'error'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'file' | 'agent-progress'
  metadata?: any
}

export default function ChartBuilderNewPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Chart gallery state
  const [charts, setCharts] = useState<Chart[]>([])
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null)

  // Data and analysis state
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [agentRecommendations, setAgentRecommendations] = useState<any>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Clear old data on mount
  useEffect(() => {
    localStorage.removeItem("currentData")
    localStorage.removeItem("agentRecommendations")
    localStorage.removeItem("originalData")
  }, [])

  // Extract analyst recommendations
  const analystRecommendations = useMemo<AnalystRecommendation[]>(() => {
    return agentRecommendations ? extractChartRecommendations(agentRecommendations) : []
  }, [agentRecommendations])

  /**
   * Handle file upload from chat
   */
  const handleFileUpload = async (data: any, fileName: string) => {
    // Add file message to chat
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploaded ${fileName}`,
      type: 'file',
      metadata: {
        fileName,
        rowCount: data.rows.length,
        columnCount: data.columns.length
      }
    }
    setChatMessages(prev => [...prev, fileMessage])

    // Set uploaded data
    setUploadedData(data)
    setIsProcessing(true)

    // Add AI acknowledgment
    const ackMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I've received your data with ${data.rows.length} rows and ${data.columns.length} columns. Let me analyze it and create professional charts for you...`
    }
    setChatMessages(prev => [...prev, ackMessage])

    // Initialize agent progress tracking
    const agentProgressId = (Date.now() + 2).toString()
    const agentNames = [
      'Data Transformer',
      'Chart Analyst',
      'Visualization Strategist',
      'Design Consultant'
    ]

    const initialAgents = agentNames.map(name => ({
      agentName: name,
      status: 'pending' as AgentStatus,
      description: getAgentDescription(name)
    }))

    const progressMessage: ChatMessage = {
      id: agentProgressId,
      role: 'system',
      content: 'Agent analysis in progress',
      type: 'agent-progress',
      metadata: { agents: initialAgents }
    }
    setChatMessages(prev => [...prev, progressMessage])

    const updateAgentStatuses = (updates: Array<{ agentName: string; status: AgentStatus }>) => {
      setChatMessages(prev =>
        prev.map((message) => {
          if (message.id !== agentProgressId || !message.metadata?.agents) {
            return message
          }

          let changed = false
          const agents = message.metadata.agents.map((agent: any) => {
            const match = updates.find((update) => update.agentName === agent.agentName)
            if (!match || agent.status === match.status) {
              return agent
            }
            changed = true
            return { ...agent, status: match.status }
          })

          if (!changed) {
            return message
          }

          return {
            ...message,
            metadata: {
              ...message.metadata,
              agents,
            },
          }
        })
      )
    }

    updateAgentStatuses([
      { agentName: 'Data Transformer', status: 'running' }
    ])

    try {
      // Call AI analysis endpoint with streaming
      const response = await fetch('/api/chat/analyze-and-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          userMessage: 'Generate consulting-level charts with insights and recommendations'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let finalResult: any = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))
              
              if (eventData.type === 'agent-start') {
                updateAgentStatuses([
                  { agentName: eventData.agentName, status: 'running' }
                ])
              } else if (eventData.type === 'agent-complete') {
                updateAgentStatuses([
                  { agentName: eventData.agentName, status: 'complete' }
                ])
              } else if (eventData.type === 'complete') {
                finalResult = eventData
                setAgentRecommendations(eventData)

                // Use transformed data if available
                const dataForChart = eventData.transformedData || data
                setUploadedData(dataForChart)

                // Generate charts from recommendations
                const recommendations = extractChartRecommendations(eventData)
                await generateChartsFromRecommendations(recommendations.slice(0, 3), dataForChart, eventData)
              } else if (eventData.type === 'error') {
                updateAgentStatuses([
                  { agentName: eventData.agentName || 'Unknown', status: 'error' }
                ])
                
                const errorMessage: ChatMessage = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `Sorry, I encountered an error with ${eventData.agentName || 'an agent'}: ${eventData.message || 'Unknown error'}`
                }
                setChatMessages(prev => [...prev, errorMessage])
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', line, parseError)
            }
          }
        }
      }

      if (!finalResult) {
        throw new Error('No final result received from analysis')
      }

    } catch (error) {
      console.error('Failed to analyze data:', error)

      updateAgentStatuses([
        { agentName: 'Data Transformer', status: 'error' },
        { agentName: 'Chart Analyst', status: 'error' },
        { agentName: 'Visualization Strategist', status: 'error' },
        { agentName: 'Design Consultant', status: 'error' }
      ])

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error analyzing your data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Generate multiple charts from recommendations
   */
  const generateChartsFromRecommendations = async (
    recommendations: AnalystRecommendation[],
    data: any,
    agentResults: any
  ) => {
    const newCharts: Chart[] = []
    const chartSpec = extractChartSpec(agentResults)

    for (const rec of recommendations) {
      try {
        const preparedData = prepareDataForRecommendation(data, rec, DEFAULT_COLORS)
        const vizStrategy = extractVizStrategy(agentResults, chartSpec)
        const design = extractDesign(agentResults, chartSpec)

        const response = await fetch('/api/chart/generate-highcharts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation: {
              chartType: rec.chartType,
              businessQuestion: rec.businessQuestion,
              chartMapping: rec.chartMapping,
              dataPreparation: rec.dataPreparation
            },
            preparedData,
            vizStrategy,
            design,
            chartSpec
          })
        })

        const result = await response.json()

        if (result.success) {
          newCharts.push({
            id: rec.id,
            title: rec.chartTitle || `${rec.chartType} chart`,
            type: rec.chartType,
            highchartsConfig: result.highchartsConfig,
            createdAt: new Date(),
            metadata: rec
          })
        }
      } catch (error) {
        console.error(`Failed to generate chart for ${rec.chartType}:`, error)
      }
    }

    setCharts(newCharts)

    // Add success message
    if (newCharts.length > 0) {
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've created ${newCharts.length} professional charts based on your data. Click any chart to customize it, or ask me to create more visualizations!`
      }
      setChatMessages(prev => [...prev, successMessage])

      // Auto-select first chart
      setSelectedChartId(newCharts[0].id)
    }
  }

  /**
   * Handle user messages in chat
   */
  const handleMessageSend = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message
    }
    setChatMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      if (selectedChartId) {
        // Edit existing chart
        const selectedChart = charts.find(c => c.id === selectedChartId)
        if (!selectedChart) return

        const response = await fetch('/api/chart/edit-highcharts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentConfig: selectedChart.highchartsConfig,
            userRequest: message,
            chatHistory: chatMessages
              .filter(m => m.type === 'text' || !m.type)
              .slice(-5) // Only last 5 messages for performance
              .map(m => ({ role: m.role, content: m.content }))
          })
        })

        const result = await response.json()

        if (result.success) {
          // Update chart
          setCharts(prev => prev.map(c =>
            c.id === selectedChartId
              ? { ...c, highchartsConfig: result.modifiedConfig }
              : c
          ))

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.assistantMessage || 'Chart updated successfully!'
          }
          setChatMessages(prev => [...prev, assistantMessage])
        } else {
          throw new Error(result.error || 'Failed to update chart')
        }
      } else {
        // General conversation or generate new chart
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: uploadedData
            ? 'Please select a chart from the gallery to edit it, or upload new data to create more charts.'
            : 'Please upload a data file to get started. I support CSV, Excel, and JSON formats.'
        }
        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Message processing error:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handle chart actions
   */
  const handleChartSelect = (id: string) => {
    setSelectedChartId(id)

    const chart = charts.find(c => c.id === id)
    if (chart) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Selected: ${chart.title}`
      }
      setChatMessages(prev => [...prev, message])
    }
  }

  const handleChartDuplicate = (id: string) => {
    const chart = charts.find(c => c.id === id)
    if (chart) {
      const newChart: Chart = {
        ...chart,
        id: `${id}-copy-${Date.now()}`,
        title: `${chart.title} (Copy)`,
        createdAt: new Date()
      }
      setCharts(prev => [...prev, newChart])
    }
  }

  const handleChartDelete = (id: string) => {
    setCharts(prev => prev.filter(c => c.id !== id))
    if (selectedChartId === id) {
      setSelectedChartId(charts.length > 1 ? charts[0].id : null)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chart Gallery (70%) */}
        <div className="flex-1">
          <ChartGallery
            charts={charts}
            selectedChartId={selectedChartId}
            onChartSelect={handleChartSelect}
            onChartDuplicate={handleChartDuplicate}
            onChartDelete={handleChartDelete}
          />
        </div>

        {/* Right Panel - Chat Interface (30%) */}
        <div className="w-[450px] border-l border-gray-200 shadow-2xl">
          <ChatInterface
            selectedChartId={selectedChartId}
            onFileUpload={handleFileUpload}
            onMessageSend={handleMessageSend}
            messages={chatMessages}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to get agent descriptions
 */
function getAgentDescription(agentName: string): string {
  const descriptions: Record<string, string> = {
    'Data Transformer': 'Analyzing structure and reshaping data...',
    'Chart Analyst': 'Recommending chart strategies...',
    'Visualization Strategist': 'Selecting optimal chart type...',
    'Design Consultant': 'Applying professional styling...'
  }
  return descriptions[agentName] || 'Processing...'
}

/**
 * Extract viz strategy from agent outputs with Zod validation
 */
function extractVizStrategy(agentResults: any, chartSpec?: ChartSpecification | null): VizStrategySpec {
  const baseViz = getDefaultVizStrategy()
  let strategy = chartSpec
    ? deriveVizStrategyFromChartSpec(chartSpec, baseViz)
    : deepMerge(baseViz, {})

  const vizOutput = agentResults?.agents?.vizStrategist?.output

  if (!vizOutput) {
    console.log('ℹ️ No Viz Strategist output, using default strategy')
    return strategy
  }

  // Use retry utility to parse and validate agent output
  const parseResult = parseAndValidateAgentOutput(
    vizOutput,
    vizStrategistOutputSchema,
    'Viz Strategist'
  )

  if (parseResult.success && parseResult.data) {
    strategy = deepMerge<VizStrategySpec>(strategy, parseResult.data)
  } else {
    console.warn('⚠️ Using fallback viz strategy due to parse failure')
  }

  return strategy
}

function getDefaultVizStrategy(): VizStrategySpec {
  return {
    staticElements: {
      dataLabels: {
        show: 'all',
        format: '${point.y:.0f}',
        positions: []
      },
      referenceLines: [],
      annotations: [],
      legend: {
        show: true,
        position: 'top-right'
      }
    },
    powerpoint: {
      exportDPI: 300,
      chartDimensions: { width: 1600, height: 800 }
    }
  }
}

/**
 * Extract design specs from agent outputs with Zod validation
 */
function extractDesign(agentResults: any, chartSpec?: ChartSpecification | null): DesignSpec {
  const baseDesign = getDefaultDesign()
  let design = chartSpec
    ? deriveDesignFromChartSpec(chartSpec, baseDesign)
    : deepMerge(baseDesign, {})

  const designOutput = agentResults?.agents?.designConsultant?.output

  if (!designOutput) {
    console.log('ℹ️ No Design Consultant output, using default design')
    return design
  }

  // Use retry utility to parse and validate agent output
  const parseResult = parseAndValidateAgentOutput(
    designOutput,
    designConsultantOutputSchema,
    'Design Consultant'
  )

  if (parseResult.success && parseResult.data) {
    design = deepMerge<DesignSpec>(design, parseResult.data)
  } else {
    console.warn('⚠️ Using fallback design due to parse failure')
  }

  return design
}

function extractChartSpec(agentResults: any): ChartSpecification | null {
  if (!agentResults) {
    return null
  }

  try {
    return parseChartSpecifications(agentResults)
  } catch (error) {
    console.warn('⚠️ Unable to parse chart specification from agent output:', error)
    return null
  }
}

function getDefaultDesign(): DesignSpec {
  return {
    palette: {
      name: 'mckinsey',
      primary: ['#004B87', '#0066B3', '#003366', '#0FA3B1', '#7209B7'],
      accents: {
        positive: '#00A859',
        negative: '#E63946',
        warning: '#F77F00',
        neutral: '#737373'
      },
      grays: ['#2C2C2C', '#4A4A4A', '#737373', '#A6A6A6', '#D9D9D9', '#F2F2F2']
    },
    typography: {
      fontFamily: 'Inter, Arial, sans-serif',
      chartTitle: { size: 20, weight: 600, color: '#2C2C2C', lineHeight: 1.3 },
      axisLabels: { size: 12, weight: 400, color: '#4A4A4A', lineHeight: 1.2 },
      dataLabels: { size: 11, weight: 500, color: '#2C2C2C', lineHeight: 1.2 },
      legendText: { size: 11, weight: 400, color: '#4A4A4A', lineHeight: 1.4 },
      annotations: { size: 11, weight: 400, color: '#2C2C2C', lineHeight: 1.3 }
    },
    spacing: {
      margins: { top: 60, right: 80, bottom: 80, left: 80 },
      lineWeight: { primary: 3, secondary: 2 },
      markerSize: { standard: 6, emphasis: 10 },
      barWidth: 65,
      barGap: 8
    },
    elements: {
      axes: { lineWeight: 1.5, lineColor: '#4A4A4A', tickLength: 5 },
      gridLines: { weight: 0.5, color: '#E5E5E5', opacity: 0.6, style: 'solid' },
      dataLabels: { fontSize: 11, fontWeight: 500, color: '#2C2C2C', offsetY: 6 },
      legend: { align: 'right', verticalAlign: 'top' },
      calloutBox: {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '#004B87',
        borderRadius: 4,
        padding: 8
      }
    },
    backgroundColor: '#FFFFFF'
  }
}
