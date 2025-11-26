"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SnowfallProps {
  count?: number
  className?: string
}

interface SnowflakeConfig {
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
}

export function Snowfall({ count = 28, className }: SnowfallProps) {
  const flakes = useMemo<SnowflakeConfig[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 7 + Math.random() * 6,
        size: 4 + Math.random() * 6,
        opacity: 0.4 + Math.random() * 0.4,
      })),
    [count],
  )

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {flakes.map((flake, index) => (
        <span
          key={index}
          className="snowflake block rounded-full bg-white mix-blend-screen"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            opacity: flake.opacity,
            width: flake.size,
            height: flake.size,
          }}
        />
      ))}
    </div>
  )
}

