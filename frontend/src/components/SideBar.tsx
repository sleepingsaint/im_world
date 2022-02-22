import { useState } from "react";
import { FaAngleDoubleLeft, FaAngleDown } from "react-icons/fa";
import { SideBarItemType } from "../types";


const SideBarItem: React.FC<{ item: SideBarItemType }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    return (
        <div>
            <p
                className="flex justify-between items-center p-1 px-2 m-1 mx-2 rounded cursor-pointer hover:bg-slate-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {item.title}
                {item.children && (
                    <FaAngleDown
                        className={`duration-200 ${
                            isOpen ? "rotate-180" : "rotate-0"
                        }`}
                    />
                )}
            </p>

            <div className={`ml-2 ${isOpen ? "block" : "hidden"}`}>
                {item.children &&
                    item.children.map((child_item, idx) => (
                        <SideBarItem item={child_item} key={idx} />
                    ))}
            </div>
        </div>
    );
};

interface SideBarProps {
    data: SideBarItemType[]
    width?: string;
}

const SideBar: React.FC<SideBarProps> = ({data, width = "300px"}) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);

    return (
        <div
            className={`h-screen border-r-2 ease-in duration-200 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{width}}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-0 z-10 p-2 border-2 border-l-0 rounded-tr rounded-br text-center"
                style={{left: width}}
            >
                <FaAngleDoubleLeft
                    className={`duration-200 ${
                        isOpen ? "rotate-0" : "rotate-180"
                    }`}
                />
            </button>
            <h2 className="text-center p-2 text-xl">Algorithms</h2>
            <hr className="mx-2" />
            {data.map((item, idx) => {
                return <SideBarItem item={item} key={idx} />;
            })}
        </div>
    );
};

export default SideBar;
