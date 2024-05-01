import { Inter } from "next/font/google";
import "./globals.css";

import Script from 'next/script';
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
      <Script
          id="Adsense-id"
          data-ad-client="ca-pub-7919093913529741"
          async="true"
          strategy="afterInteractive"
          crossorigin="anonymous"
        />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
