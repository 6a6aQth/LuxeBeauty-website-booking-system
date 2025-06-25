'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToHash() {
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const element = document.getElementById(hash.substring(1))

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } else {
        // Fallback for when the element is not immediately available.
        // This can happen with animated sections or other dynamic content.
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1))
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }
        }, 500)
      }
    }
  }, [pathname])

  return null
} 