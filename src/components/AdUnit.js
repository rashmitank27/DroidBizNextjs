// src/components/AdUnit.js - Minimal fix for better ad display
import React, { Suspense } from "react"
import AdUnitClient from "./AdUnitClient"

const AdUnit = ({ children }) => {
  return (
    <Suspense fallback={<div style={{ minHeight: '100px' }}>Loading ad...</div>}>
        <AdUnitClient>{children}</AdUnitClient>
    </Suspense>
  )
}

export default AdUnit

export function InArticleAd({ className }) {
  return (
    <div className={className} style={{ margin: '20px 0', textAlign: 'center' }}>
      <AdUnit>
        <ins
          className="adsbygoogle"
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          style={{ display: "block", minHeight: "100px" }}
          data-ad-format="auto"
          data-ad-slot="3534351170"
          data-full-width-responsive="true"
        ></ins>
      </AdUnit>
    </div>
  )
}