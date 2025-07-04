"use client"
import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import React from "react"

export default function AdUnitClient({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error(err)
    }
  }, [pathname, searchParams])
  return <>{children}</>
}
