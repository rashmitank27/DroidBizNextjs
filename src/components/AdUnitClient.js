"use client"
import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function AdUnitClient({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const retryCount = useRef(0)
  const maxRetries = 3

  const loadAd = () => {
    try {
      // Check if adsbygoogle is available
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
        console.log('Ad loaded successfully')
        retryCount.current = 0
      } else {
        // Retry if adsbygoogle not available yet
        if (retryCount.current < maxRetries) {
          retryCount.current++
          console.log(`AdSense not ready, retrying... (${retryCount.current}/${maxRetries})`)
          setTimeout(loadAd, 1000 * retryCount.current)
        } else {
          console.error('AdSense failed to load after maximum retries')
        }
      }
    } catch (err) {
      console.error('AdSense error:', err)
      // Retry on error
      if (retryCount.current < maxRetries) {
        retryCount.current++
        setTimeout(loadAd, 2000)
      }
    }
  }

  useEffect(() => {
    // Reset retry count on route change
    retryCount.current = 0
    
    // Wait for page to settle before loading ads
    const timer = setTimeout(loadAd, 500)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return <>{children}</>
}