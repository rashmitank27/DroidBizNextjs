import React, { Suspense } from "react"
import AdUnitClient from "./AdUnitClient"

const AdUnit = ({ children, adKey }) => {
  return (
    <Suspense fallback={<div>Loading ad...</div>}>
        <AdUnitClient key={adKey}>{children}</AdUnitClient>
    </Suspense>
  )
}

export default AdUnit

export function InArticleAd({ className }) {
  // Use pathname or random key to ensure fresh ad rendering
  const adKey = typeof window !== 'undefined' ? window.location.pathname : Math.random()
  
  return (
    <div className={`${className} ad-container`}>
      <AdUnit adKey={adKey}>
        <ins
          className="adsbygoogle"
          data-ad-client={process.env.googleClientId}
          style={{ display: "block" }}
          data-ad-format="auto"
          data-ad-slot="3534351170"
          data-full-width-responsive="true"
        ></ins>
      </AdUnit>
    </div>
  )
}
