"use client";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();

  const navLinkStyle = (path) =>
    `transition hover:text-white ${
      pathname === path ? "text-white" : "text-gray-500"
    }`;

  return (
    <header className="mt-6 flex justify-between items-center px-6 py-4 mx-auto max-w-7xl rounded-full bg-[#202020] border border-gray-500 shadow-inner backdrop-blur-md">
      <div className="flex items-center gap-8">
        <h1 className="font-orbitron text-white text-2xl tracking-wider font-semibold">
          SaveFi
        </h1>

        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/" className={navLinkStyle("/")}>
            Home
          </Link>
          <Link href="/plan" className={navLinkStyle("/plan")}>
            Plan
          </Link>
          <Link href="/dashboard" className={navLinkStyle("/dashboard")}>
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* <div className="flex items-center gap-4 bg-[#141414] border border-[#2a2a2a] text-sm px-4 py-1.5 rounded-full text-white">
          <div>
            <span className="text-gray-400">TVL ($)</span>{" "}
            <span className="text-purple-400 font-semibold">3.2M</span>
          </div>
          <div className="w-px h-4 bg-[#2a2a2a]" />
          <div>
            <span className="text-gray-400">Yield ($)</span>{" "}
            <span className="text-purple-400 font-semibold">187K</span>
          </div>
        </div> */}

        <div className="ml-2">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
