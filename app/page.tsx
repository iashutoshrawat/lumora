"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sparkles,
  BarChart3,
  Download,
  Zap,
  Shield,
  TrendingUp,
  MessageSquare,
  Palette,
  FileSpreadsheet
} from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI-Powered",
      desc: "Chat naturally with our AI to create charts instantly using natural language"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Professional Design",
      desc: "Enterprise-grade visualizations ready for presentations and reports"
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: "Easy Export",
      desc: "Download as PNG, SVG, PDF, or PowerPoint slides with one click"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Conversational UI",
      desc: "Modify charts by simply describing what you want in plain English"
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: "Multiple Formats",
      desc: "Support for CSV, Excel, JSON and more data formats"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-time Updates",
      desc: "See your charts update live as you customize and refine them"
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Lumora
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" className="font-medium border-gray-300 text-gray-700 hover:bg-gray-50">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full mb-6 border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">AI-Powered Chart Creation</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
          Create Professional Charts<br />with AI Conversations
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload your data, chat with our AI agent, and generate stunning visualizations in seconds.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium shadow-sm">
              Start Creating Free
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              variant="outline"
              className="px-8 py-3 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make data visualization effortless
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="p-8 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-blue-600 p-12 text-center text-white border-0 shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Start creating professional charts with AI today. Free forever, no credit card required.
          </p>
          <Link href="/signup">
            <Button
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-base font-semibold shadow-sm"
            >
              Create Your First Chart
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Lumora</span>
            </div>
            <p className="text-sm text-gray-600">&copy; 2025 Lumora. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="#" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
