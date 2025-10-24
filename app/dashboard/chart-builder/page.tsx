"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar"
import ChartCanvas from "@/components/chart-builder/chart-canvas"
import AgentPanel from "@/components/chart-builder/agent-panel"
import { buildChartPlan, extractChartRecommendations, type ChartPlan, type AnalystRecommendation } from "@/lib/utils/chart-plan"

export default function ChartBuilderPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chartType, setChartType] = useState("bar")
  const [chartConfig, setChartConfig] = useState<any>({
    xAxis: null,
    yAxis: null,
    colors: ["#00BFFF"],
  })
  const [agentRecommendations, setAgentRecommendations] = useState<any>(null)
  const [chartPlan, setChartPlan] = useState<ChartPlan | null>(null)
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null)
  const [chartTypeOverridden, setChartTypeOverridden] = useState(false)

  useEffect(() => {
    const currentData = localStorage.getItem("currentData")
    if (!currentData) {
      router.push("/dashboard/upload")
    } else {
      setData(JSON.parse(currentData))
    }

    // Load agent recommendations if available
    const recommendations = localStorage.getItem("agentRecommendations")
    if (recommendations) {
      const parsedRecs = JSON.parse(recommendations)
      setAgentRecommendations(parsedRecs)

      setChartTypeOverridden(false)
      setSelectedRecommendationId(null)
    }
  }, [router])

  const analystRecommendations = useMemo<AnalystRecommendation[]>(() => {
    return agentRecommendations ? extractChartRecommendations(agentRecommendations) : []
  }, [agentRecommendations])

  useEffect(() => {
    if (!data || !agentRecommendations) {
      setChartPlan(null)
      return
    }

    if (!selectedRecommendationId && analystRecommendations.length > 0) {
      setSelectedRecommendationId(analystRecommendations[0].id)
    }

    try {
      const plan = buildChartPlan(data, agentRecommendations, {
        selectedRecommendationId,
      })
      setChartPlan(plan)

      if (plan && !chartTypeOverridden) {
        setChartType(plan.chartType)
      }
    } catch (error) {
      console.error('Failed to build chart plan:', error)
      setChartPlan(null)
    }
  }, [data, agentRecommendations, selectedRecommendationId, chartTypeOverridden, analystRecommendations])

  useEffect(() => {
    if (chartPlan && chartPlan.data) {
      console.log('🧭 Chart plan applied:', {
        chartType: chartPlan.chartType,
        xKey: chartPlan.xKey,
        series: chartPlan.series,
        recommendationId: chartPlan.recommendationId
      })

      if (typeof window !== 'undefined') {
        let cancelled = false
        const logPlan = async () => {
          try {
            await fetch('/api/debug/chart-plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chartPlan)
            })
          } catch (error) {
            if (!cancelled) {
              console.error('Failed to send chart plan to server log:', error)
            }
          }
        }

        logPlan()
        return () => {
          cancelled = true
        }
      }
    }
  }, [chartPlan])

  const handleRecommendationSelect = (id: string) => {
    setSelectedRecommendationId(id)
    setChartTypeOverridden(false)
  }

  const handleChartTypeChange = (type: string) => {
    setChartType(type)
    setChartTypeOverridden(true)
  }

  if (!data) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Chart Canvas - Left Panel (70%) */}
        <div className="flex-1 flex flex-col bg-white">
          <ChartCanvas
            data={chartPlan?.data || data}
            chartType={chartType}
            config={chartConfig}
            agentRecommendations={agentRecommendations}
            onChartTypeChange={handleChartTypeChange}
            chartPlan={chartPlan}
          />
        </div>

        {/* Agent Panel - Right Panel (30%) */}
        <div className="w-[400px] border-l border-gray-200 shadow-2xl">
          <AgentPanel
            agentResults={agentRecommendations}
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
            onChartUpdate={setChartConfig}
            data={data}
            chartPlan={chartPlan}
            recommendations={analystRecommendations}
            selectedRecommendationId={selectedRecommendationId}
            onRecommendationSelect={handleRecommendationSelect}
          />
        </div>
      </div>
    </div>
  )
}
