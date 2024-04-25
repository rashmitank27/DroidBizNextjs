import { data } from 'autoprefixer';
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Sidebar({ show, setter, pathname, subjectDetails }) {
    const router = useRouter();

    // Define our base class
    const className = "bg-black w-[250px] transition-[margin-left] ease-in-out duration-500 fixed md:static top-0 bottom-0 left-0 z-40";
    // Append class based on state of sidebar visiblity
    const appendClass = show ? " ml-0" : " ml-[-250px] md:ml-0";

    // Clickable menu items
    const MenuItem = ({ name, route, subject1, topic1 }) => {
        // Highlight menu item based on currently displayed route
        const colorClass = router.pathname === route ? "text-white" : "text-white/50 hover:text-white";

        return (
            <Link
                href={route}
                onClick={() => {
                    setter(oldVal => !oldVal);
                }}
                className={`flex gap-1 [&>*]:my-auto text-md pl-6 py-3 border-b-[1px] border-b-white/10 ${colorClass}`}
            >
                <div>{name}</div>
            </Link>
        )
    }

    // Overlay to prevent clicks in background, also serves as our close button
    const ModalOverlay = () => (
        <div
            className={`flex md:hidden fixed top-0 right-0 bottom-0 left-0 bg-black/50 z-30`}
            onClick={() => {
                setter(oldVal => !oldVal);
            }}
        />
    )

    console.log("pathname: ", pathname);

    let route;

    return (
        <>
            <div className={`${className}${appendClass}`}>
                <div className="flex flex-col">
                    {
                        subjectDetails.content.map((data) => {
                            if(pathname === "/") {
                                route = subjectDetails.id + "/" + data.url;
                            } else {
                                route = data.url;
                            }
                            console.log("route: ", route);
                            return (
                                <MenuItem name={data.title} route={route}></MenuItem>
                            );
                        })
                    }
                </div>
            </div>
            {show ? <ModalOverlay /> : <></>}
        </>
    )
}