"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/queue", label: "Review Queue", Icon: ClipboardList },
  { href: "/settings", label: "Settings", Icon: Settings },
];

const styles = {
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#0d0d0d",
    borderRight: "1px solid #1f1f1f",
    width: "240px",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    padding: "20px 16px",
    borderBottom: "1px solid #1f1f1f",
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  nav: {
    flex: 1,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  navItemBase: {
    display: "flex",
    alignItems: "center",
    padding: "9px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.15s ease",
    gap: 10,
  },
  navItemActive: {
    backgroundColor: "#6366f1",
    color: "#ffffff",
  },
  navItemInactive: {
    color: "#71717a",
    backgroundColor: "transparent",
  },
  version: {
    padding: "16px",
    fontSize: 12,
    color: "#3f3f46",
    borderTop: "1px solid #1f1f1f",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
  },
  mobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #1f1f1f",
    backgroundColor: "#0d0d0d",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "32px",
    backgroundColor: "#0a0a0a",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 40,
  },
  mobileSidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: "#0d0d0d",
    borderRight: "1px solid #1f1f1f",
    width: 240,
  },
};

function NavItem({ href, label, Icon, onClick }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        ...styles.navItemBase,
        ...(isActive ? styles.navItemActive : styles.navItemInactive),
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#1a1a1a";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#71717a";
        }
      }}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function SidebarContent({ onNavClick }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={styles.logoText}>CreatorQC</span>
      </div>
      <nav style={styles.nav}>
        {navItems.map(({ href, label, Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            onClick={onNavClick}
          />
        ))}
      </nav>
      <div style={styles.version}>v1.0.0</div>
    </div>
  );
}

export default function RootLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <body className={inter.className} style={{
        margin: 0,
        padding: 0,
        backgroundColor: "#0a0a0a",
        color: "#f4f4f5"
      }}>
        <QueryClientProvider client={queryClient}>
          <div style={{ display: "flex", height: "100vh",
            backgroundColor: "#0a0a0a", overflow: "hidden" }}>

            {/* Desktop Sidebar */}
            <div style={{ display: "none" }} className="md:block">
              <SidebarContent />
            </div>
            <div style={styles.sidebar}
              className="hidden md:flex">
              <SidebarContent />
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
              <>
                <div
                  style={styles.overlay}
                  onClick={() => setMobileOpen(false)}
                />
                <div style={styles.mobileSidebar}>
                  <SidebarContent onNavClick={() => setMobileOpen(false)} />
                </div>
              </>
            )}

            {/* Main content */}
            <div style={styles.main}>
              {/* Mobile header */}
              <header style={styles.mobileHeader} className="md:hidden">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={styles.logoIcon}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 4.5" stroke="white"
                        strokeWidth="2" strokeLinecap="round"
                        strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={styles.logoText}>CreatorQC</span>
                </div>
                <button
                  onClick={() => setMobileOpen(true)}
                  style={{
                    background: "none", border: "none",
                    color: "#71717a", cursor: "pointer", padding: 4
                  }}
                >
                  <Menu size={22} />
                </button>
              </header>

              <main style={styles.content}>
                {children}
              </main>
            </div>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}