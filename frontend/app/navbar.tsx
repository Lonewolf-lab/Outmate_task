"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: "Social Intent", href: "/social-intent" },
    { name: "GTM Intelligence", href: "/gtm" },
    { name: "Voice Agent", href: "/voice" },
  ];

  return (
    <nav className="w-full h-16 border-b border-slate-200 bg-white shadow-sm px-6 flex items-center shrink-0">
      <div className="w-64 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
        Outmate
      </div>
      
      <div className="flex-1 flex justify-center items-center gap-8 h-full">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors h-full flex items-center border-b-2 ${
                isActive
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
      
      <div className="w-64"></div>
    </nav>
  );
}
