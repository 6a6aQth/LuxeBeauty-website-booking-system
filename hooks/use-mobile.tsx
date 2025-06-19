import { useState, useEffect } from "react"

export function useIsMobile(query = "(max-width: 767px)") {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const updateIsMobile = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    
    // Set the initial state
    setIsMobile(mediaQuery.matches)

    // Add listener for changes
    mediaQuery.addEventListener("change", updateIsMobile)

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile)
    }
  }, [query])

  return isMobile
}
