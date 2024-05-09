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

    return (
        <>
            <div className="relative top-4">
            {/* <div className="fixed top-4"> */}
                <button
                    className="text-white/70 hover:text-white top-4"
                    onClick={toggle}
                >Tutorials</button>
                <div className={`absolute top-8 z-30 w-[150px] min-h-[20px] flex flex-col py-4 bg-white rounded-md ${transClass}`}>
                    {
                        firestoreData.map(data =>
                            <Link
                                key={data.id}
                                className="hover:text-teal-800 text-teal-700 px-4 py-1"
                                href={data.base_url}
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
                        className="fixed top-0 right-0 bottom-0 left-0 z-20 bg-transparent"
                        onClick={toggle}
                    ></div>
                    :
                    <></>
            }
        </>
    )
}