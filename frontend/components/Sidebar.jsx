"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, BarChart2 } from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/queue", icon: List, label: "Review Queue" },
    { href: "/submissions", icon: BarChart2, label: "Submissions" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-semibold">CreatorQC</div>
      <nav className="flex-1 px-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
