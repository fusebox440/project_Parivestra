"use client";

import { Inter } from "next/font/google";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Menu,
  Square,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

const NavItem = ({ href, icon: Icon, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary/50"
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      {children}
    </Link>
  );
};

const Sidebar = () => (
  <div className="flex flex-col h-full bg-card border-r border-border">
    <div className="p-4 flex items-center">
      <Square className="h-6 w-6 text-primary" />
      <h1 className="ml-2 text-lg font-semibold">CreatorQC</h1>
    </div>
    <nav className="flex-1 px-2 py-4 space-y-1">
      <NavItem href="/dashboard" icon={LayoutDashboard}>
        Dashboard
      </NavItem>
      <NavItem href="/queue" icon={ClipboardList}>
        Review Queue
      </NavItem>
      <NavItem href="/settings" icon={Settings}>
        Settings
      </NavItem>
    </nav>
    <div className="p-4 text-xs text-muted-foreground">v1.0.0</div>
  </div>
);

export default function RootLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="flex h-screen bg-background">
            <div className="hidden md:flex md:w-60">
              <Sidebar />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center">
                  <Square className="h-6 w-6 text-primary" />
                  <h1 className="ml-2 text-lg font-semibold">CreatorQC</h1>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <button className="p-2">
                      <Menu className="h-6 w-6" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-60 p-0">
                    <Sidebar />
                  </SheetContent>
                </Sheet>
              </header>
              <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
              </main>
            </div>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
