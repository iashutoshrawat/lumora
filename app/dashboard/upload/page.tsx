"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const router = useRouter()

  // Redirect to chart builder (upload is now integrated there)
  useEffect(() => {
    router.replace("/dashboard/chart-builder-new")
  }, [router])

  return null
}
