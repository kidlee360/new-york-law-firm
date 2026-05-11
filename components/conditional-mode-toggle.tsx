"use client"

import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect, useState } from "react"

export function ConditionalModeToggle() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Ensure the component is mounted to avoid hydration mismatches with themes
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we are on the home page. 
  // We check for exactly "/", an empty path, or null (which can happen during hydration).
  const isHomePage = pathname === "/" || !pathname || pathname === ""

  if (!mounted || isHomePage) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <ModeToggle />
    </div>
  )
}