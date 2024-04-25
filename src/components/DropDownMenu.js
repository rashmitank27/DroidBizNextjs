import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function DropdownMenu({firestoreData}) {
    const pathname = usePathname();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    
    const transClass = isOpen
        ?
        "flex"
        :
        "hidden";
    
    const toggle = () => {
        setIsOpen(old => !old);
    }

    console.log("pathname: ", pathname);

    // let route;
    // // subjectDetails.content.map((data) => {
    //     if(pathname === "/") {
    //         route = subjectDetails.id + "/introduction";
    //     } else {
    //         route = data.url;
    //     }
    //     console.log("route: ", route);
    
    // })

    return (
        <>
            <div className="relative">
                <button
                    className="hover:text-blue-400"
                    onClick={toggle}
                >Tutorial</button>
                <div className={`absolute top-8 z-30 w-[200px] min-h-[20px] flex flex-col py-4 bg-zinc-400 rounded-md ${transClass}`}>
                    {
                        firestoreData.map(data =>
                            <Link
                                key={data.id}
                                className="hover:bg-zinc-300 hover:text-zinc-500 px-4 py-1"
                                href="flutter/introduction"
                                onClick={
                                    toggle
                                }
                            >{data.name}</Link>
                        )
                    }
                </div>
            </div>
            {
                isOpen
                    ?
                    <div
                        className="fixed top-0 right-0 bottom-0 left-0 z-20 bg-black/40"
                        onClick={toggle}
                    ></div>
                    :
                    <></>
            }
        </>
    )
}