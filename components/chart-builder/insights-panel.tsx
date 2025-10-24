"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InsightsPanelProps {
  agentResults: any
}

export default function InsightsPanel({ agentResults }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')

  if (!agentResults) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No AI analysis available. Generate a chart from the upload page to see insights.</p>
      </div>
    )
  }

  const { agents, summary } = agentResults

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-primary">AI Insights & Recommendations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Multi-agent analysis from 4 specialized AI consultants
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-border">
        <Button
          variant={activeTab === 'summary' ? 'default' : 'outline'}
          onClick={() => setActiveTab('summary')}
          className="text-sm"
        >
          Summary
        </Button>
        <Button
          variant={activeTab === 'details' ? 'default' : 'outline'}
          onClick={() => setActiveTab('details')}
          className="text-sm"
        >
          Detailed Analysis
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Data Analyst Summary */}
            {summary?.dataInsights && summary.dataInsights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm text-gray-800">Data Analyst</h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {summary.dataInsights.map((insight: string, i: number) => (
                    <li key={i} className="pl-4">• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Viz Strategist Summary */}
            {summary?.chartRecommendation && summary.chartRecommendation.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm text-gray-800">Visualization Strategist</h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {summary.chartRecommendation.map((rec: string, i: number) => (
                    <li key={i} className="pl-4">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Design Consultant Summary */}
            {summary?.styleGuide && summary.styleGuide.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm text-gray-800">Design Consultant</h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {summary.styleGuide.map((style: string, i: number) => (
                    <li key={i} className="pl-4">• {style}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insight Narrator Summary */}
            {summary?.narrative && summary.narrative.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-sm text-gray-800">Insight Narrator</h3>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {summary.narrative.map((narr: string, i: number) => (
                    <li key={i} className="pl-4">• {narr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-8">
            {/* Full Data Analyst Output */}
            {agents?.dataAnalyst && (
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Data Analyst
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({agents.dataAnalyst.role})
                  </span>
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {agents.dataAnalyst.output}
                </div>
              </div>
            )}

            {/* Full Viz Strategist Output */}
            {agents?.vizStrategist && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Visualization Strategist
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({agents.vizStrategist.role})
                  </span>
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {agents.vizStrategist.output}
                </div>
              </div>
            )}

            {/* Full Design Consultant Output */}
            {agents?.designConsultant && (
              <div className="border-l-4 border-pink-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Design Consultant
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({agents.designConsultant.role})
                  </span>
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {agents.designConsultant.output}
                </div>
              </div>
            )}

            {/* Full Insight Narrator Output */}
            {agents?.insightNarrator && (
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Insight Narrator
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({agents.insightNarrator.role})
                  </span>
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {agents.insightNarrator.output}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
