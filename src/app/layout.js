import { Inter } from "next/font/google";
import "./globals.css";

import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Script
          id="Adsense-id"
          data-ad-client="ca-pub-7919093913529741"
          async="true"
          strategy="beforeInteractive"
          crossorigin="anonymous"
        />
      <body className={inter.className}>{children}</body>
    </html>
  );
}
