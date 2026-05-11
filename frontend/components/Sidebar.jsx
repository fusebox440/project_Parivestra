"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Settings as SettingsIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navItems = [
  {
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Dashboard",
  },
  {
    href: "/queue",
    icon: <ClipboardList className="h-5 w-5" />,
    label: "Review Queue",
  },
  {
    href: "/settings",
    icon: <SettingsIcon className="h-5 w-5" />,
    label: "Settings",
  },
];

const NavLink = ({ item, pathname, onClick }) => {
  const isActive = pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        isActive
          ? "bg-indigo-600 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
};

export default function Sidebar({ onClose }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-zinc-950 text-white">
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="h-6 w-6 rounded-md bg-purple-600" />
          <span>CreatorQC</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onClick={onClose} />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-zinc-800 p-4">
        <span className="text-xs text-zinc-500">v1.0.0</span>
      </div>
    </div>
  );
}
