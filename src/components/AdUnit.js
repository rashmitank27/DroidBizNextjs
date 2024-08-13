import React, { Suspense } from "react"
import AdUnitClient from "./ad-unit-client"
import { Card } from "./ui/card"


const AdUnit = ({ children }) => {
  return (
    <Suspense>
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
