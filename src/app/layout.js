// src/app/layout.js - Fixed version without event handlers
import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "",
  description: "",
  // Add this line for AdSense verification
  other: {
    'google-adsense-account': process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Initialize AdSense queue early */}
        <Script
          id="adsense-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.adsbygoogle = window.adsbygoogle || [];`,
          }}
        />
        
        {/* Main AdSense Script - REMOVED onLoad and onError handlers */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        
        {children}
      </body>   
    </html>
  );
}