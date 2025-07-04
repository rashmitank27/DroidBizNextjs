import React, { Suspense } from "react"
import AdUnitClient from "./AdUnitClient"

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
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          style="display:inline-block;width:300px;height:250px"
          data-ad-slot="7666513623"
        ></ins>
      </AdUnit>
    </div>
  )
}
