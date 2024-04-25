'use client'

import React, { useState } from 'react'
import Head from 'next/head'
import Sidebar from './Sidebar';
import MenuBarMobile from './MenuBarMobile';
import { usePathname } from 'next/navigation'

export default function Layout({ children, subjectDetails, firestoreData }) {
    console.log("Log in Layout");

    // Mobile sidebar visibility state
    const [showSidebar, setShowSidebar] = useState(false);

    const pathname = usePathname()

    return (
        <>
            <Head>
                {/* <title>{titleConcat}</title> */}
            </Head>
            <div className="min-h-screen">
                <div className="flex">
                    <MenuBarMobile setter={setShowSidebar} subjectDetails = {subjectDetails} firestoreData = {firestoreData}/>
                    <Sidebar show={showSidebar} setter={setShowSidebar} pathname = {pathname} subjectDetails = {subjectDetails}/>
                    <div className="flex flex-col flex-grow w-screen md:w-full min-h-screen">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}