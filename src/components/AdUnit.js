import React, { Suspense } from "react"
import AdUnitClient from "./AdUnitClient"

const AdUnit = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading ad...</div>}>
        <AdUnitClient>{children}</AdUnitClient>
    </Suspense>
  )
}

export default AdUnit

export function InArticleAd({ className }) {
  return (
    <div className={className}>
      <AdUnit>
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
