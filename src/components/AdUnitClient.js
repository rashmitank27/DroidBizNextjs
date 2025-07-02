"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function AdUnitClient({ children }) {
  const pathname = usePathname()

  useEffect(() => {
    const pushAd = () => {
      try {
        // Wait for adsbygoogle to be available
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            (window.adsbygoogle = window.adsbygoogle || []).push({})
          }, 100)
        } else {
          // Retry if adsbygoogle isn't loaded yet
          setTimeout(pushAd, 500)
        }
      } catch (err) {
        console.error('AdSense Error:', err)
      }
    }

    pushAd()
  }, [pathname]) // Re-run when route changes

  return <>{children}</>
}
