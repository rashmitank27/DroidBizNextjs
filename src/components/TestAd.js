// components/TestAd.js
"use client"
import { useEffect } from 'react'

export default function TestAd() {
  useEffect(() => {
    console.log('AdSense Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
    console.log('Window adsbygoogle:', typeof window !== 'undefined' ? window.adsbygoogle : 'Server side')
  }, [])

  return (
    <div style={{ border: '2px solid red', padding: '20px', margin: '20px' }}>
      <p>Test Ad Container</p>
      <p>Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT FOUND'}</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-ad-slot="3534351170"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  )
}
