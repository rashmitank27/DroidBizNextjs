import { data } from 'autoprefixer';
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Sidebar({ show, setter, pathname, subjectDetails }) {
    const router = useRouter();

    // Define our base class
    const className = "bg-teal-700 w-[260px] transition-[margin-left] ease-in-out duration-500 fixed top-0 bottom-0 left-0 z-40";
    // Append class based on state of sidebar visiblity
    const appendClass = show ? " ml-0" : " ml-[-260px] md:ml-0";

    const sidebarClass = "w-[260px] top-32 transition-[margin-left] ease-in-out duration-500 fixed bottom-0 left-0 z-40 overflow-auto";

    // Clickable menu items
    const MenuItem = ({ name, route, subject1, topic1 }) => {
        // Highlight menu item based on currently displayed route
        const colorClass = router.pathname === route ? "text-white" : "text-white/80 hover:text-white";

        return (
            <Link
                href={route}
                onClick={() => {
                    setter(oldVal => !oldVal);
                }}
                className={`flex gap-1 [&>*]:my-auto text-md pl-6 py-3 ${colorClass}`}
            >
                <div>{name}</div>
            </Link>
        )
    }

    // Overlay to prevent clicks in background, also serves as our close button
    const ModalOverlay = () => (
        <div
            className={`flex md:hidden fixed top-0 right-0 bottom-0 left-0 bg-transparent z-30`}
            onClick={() => {
                setter(oldVal => !oldVal);
            }}
        />
    )


    return (
        <>
            <div className={`${className}${appendClass}`}>
                <Link href="/" className="fixed w-[250px] h-[120px] flex [&amp;>*]:my-auto">
                    <img
                        className="items-center mx-auto"
                        src="/logo.png"
                        alt="Logo"
                        width={70}
                        height={70}
                    />
                </Link>
                <div className={`${sidebarClass}${appendClass}`}>
                    {
                        subjectDetails.content.map((data) => {
                            return (
                                <MenuItem name={data.title} route={"/" + subjectDetails.id + "/" + data.url}></MenuItem>
                            );
                        })
                    }
                </div>
            </div>
            {show ? <ModalOverlay /> : <></>}
        </>
    )
}