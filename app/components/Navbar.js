import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex w-full justify-evenly items-center p-3 bg-amber-700 shadow-lg shadow-orange-950 fixed top-0 left-0 right-0 z-50">
      <Link href={"/"}><div className="title text-3xl font-bold">
        {" "}
        <img
          className="mx-auto"
          width="50"
          height="50"
          src="https://img.icons8.com/ios-filled/50/law.png"
          alt="law"
        />
        ADVOCAT-Easy
      </div>
      </Link> 
      <div>an EDUCATIONAL legal counsel app by G10</div>
      <Link
        href={"/"}
        className="inline-block px-5 py-2.5 bg-orange-500 text-white font-medium shadow-sm shadow-black text-sm rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
      >
        GitHub
      </Link>
    </div>
  );
};

export default Navbar;
