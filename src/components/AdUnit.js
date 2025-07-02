import React, { Suspense } from "react"
import AdUnitClient from "./AdUnitClient"

const AdUnit = ({ children, adKey }) => {
  return (
    <Suspense fallback={<div style={{ minHeight: '200px' }}>Loading ad...</div>}>
        <AdUnitClient key={adKey}>{children}</AdUnitClient>
    </Suspense>
  )
}

export default AdUnit

export function InArticleAd({ className }) {
  // Use pathname or random key to ensure fresh ad rendering
  const adKey = typeof window !== 'undefined' ? window.location.pathname : Math.random()
  
  return (
    <div className={className} style={{ minHeight: '200px' }}>
      <AdUnit>
        <ins
          className="adsbygoogle"
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          style={{ display: "block" }}
          data-ad-format="auto"
          data-ad-slot="3534351170"
          data-full-width-responsive="true"
        ></ins>
      </AdUnit>
    </div>
  )
}
