'use client'

import React, { useState } from 'react'
import Head from 'next/head'
import Sidebar from './Sidebar';
import MenuBarMobile from './MenuBarMobile';
import { usePathname } from 'next/navigation'
import BlogMenuBar from './BlogMenuBar';

export default function BlogLayout({ children, subjectDetails, firestoreData }) {

    // Mobile sidebar visibility state
    const [showSidebar, setShowSidebar] = useState(false);

    const pathname = usePathname()

    return (
        <>
            <Head>
                {}
            </Head>
            <div className="min-h-screen">
                <div className="flex">
                    <BlogMenuBar setter={setShowSidebar} subjectDetails = {subjectDetails} firestoreData = {firestoreData}/>
                    <div className="flex flex-col flex-grow w-screen md:w-full min-h-screen">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}