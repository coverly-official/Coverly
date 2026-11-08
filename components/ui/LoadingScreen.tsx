"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false)
      return
    }

    // Show for 1200ms, then fade out over 300ms
    const showTimeout = setTimeout(() => {
      setOpacity(0)
    }, 1200)

    const fadeTimeout = setTimeout(() => {
      setVisible(false)
    }, 1500)

    // Cleanup on unmount or visibility change
    return () => {
      clearTimeout(showTimeout)
      clearTimeout(fadeTimeout)
    }
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] bg-surface transition-opacity duration-300",
        opacity === 0 ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-navy font-semibold text-3xl">Coverly</h1>
        <p className="text-ink opacity-70">What is Coverly?</p>
      </div>
    </div>
  )
}
