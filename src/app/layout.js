import { Inter } from "next/font/google";
import "./globals.css";

import Script from 'next/script';
import Head from "next/head";
import GoogleAdsenseScript from "@/components/GAdsense";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      {/* <GoogleAdsenseScript/>     */}
    </html>
  );
}
