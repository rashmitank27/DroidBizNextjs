"use client"
import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import React from "react"

export default function AdUnitClient({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const adRef = useRef(null)
  const isAdPushed = useRef(false)

  useEffect(() => {
    const pushAd = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle && !isAdPushed.current) {
          // Clear any existing ad content
          const adElement = adRef.current?.querySelector('.adsbygoogle')
          if (adElement) {
            adElement.innerHTML = ''
          }
          
          // Push new ad
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          isAdPushed.current = true
        }
      } catch (err) {
        console.error('AdSense Error:', err)
      }
    }

    // Reset ad push flag on route change
    isAdPushed.current = false
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(pushAd, 100)
    
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return <div ref={adRef}>{children}</div>
}
