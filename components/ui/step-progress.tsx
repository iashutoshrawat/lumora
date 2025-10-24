"use client"

import { Check } from "lucide-react"

interface Step {
  number: number
  title: string
  status: 'completed' | 'current' | 'upcoming'
}

interface StepProgressProps {
  steps: Step[]
}

export default function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step.status === 'completed'
                    ? 'bg-accent text-white shadow-lg scale-105'
                    : step.status === 'current'
                    ? 'bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.number
                )}
              </div>

              {/* Step Title */}
              <div className="absolute -bottom-8 whitespace-nowrap">
                <span
                  className={`text-sm font-medium ${
                    step.status === 'upcoming'
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 relative">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    step.status === 'completed'
                      ? 'bg-accent w-full'
                      : 'bg-accent w-0'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
