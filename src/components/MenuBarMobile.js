import React from 'react'
import Link from 'next/link'
import { FiMenu as Icon } from 'react-icons/fi'
import DropdownMenu from './DropDownMenu';

export default function MenuBarMobile({ setter, subjectDetails, firestoreData }) {
    return (
        <nav className="z-20 fixed top-0 left-0 right-0 h-[60px] bg-black flex [&>*]:my-auto px-2">
            <button
                className="text-4xl flex text-white"
                onClick={() => {
                    setter(oldVal => !oldVal);
                }}
            >
                <Icon />
            </button>
        
            <div className="mx-auto gap-8 items-center text-white">
                {
                    <DropdownMenu firestoreData = {firestoreData}/>
                }
            </div>
        </nav>
    )
}