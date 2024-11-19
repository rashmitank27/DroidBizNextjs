import React from 'react'
import Link from 'next/link'
import { FiMenu as Icon } from 'react-icons/fi'
import DropdownMenu from './DropDownMenu';

export default function BlogMenuBar({ setter, subjectDetails, firestoreData }) {
    return (
        <nav className="z-20 fixed top-0 left-0 right-0 h-[60px] bg-teal-700 flex [&>*]:my-auto px-2">
            {/* <button
                className="text-4xl flex text-white"
                onClick={() => {
                    setter(oldVal => !oldVal);
                }}
            >
                <Icon />
            </button> */}
            <Link href="/" className="ml-9">
                <img
                    src="/logo.png"
                    alt="Logo"
                    width={50}
                    height={50}
                />
            </Link>
            {/* <div className="mx-auto gap-8 items-center text-white"> */}
            {/* <div className="fixed right-0 w-[250px] h-[60px] gap-8 items-center text-white"> */}
            <div className="fixed right-0 w-[200px] gap-8 items-center text-white">
                {
                    <DropdownMenu firestoreData = {firestoreData}/>
                }
            </div>
        </nav>
    )
}