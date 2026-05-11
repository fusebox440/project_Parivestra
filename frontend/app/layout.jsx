"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen">
            <aside className="w-64 bg-gray-800 text-white p-4">
              <header className="mb-8">
                <h1 className="text-2xl font-bold">CreatorQC</h1>
              </header>
              <nav>
                <ul className="space-y-2">
                  <li><Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">Dashboard</Link></li>
                  <li><Link href="/queue" className="block p-2 rounded hover:bg-gray-700">Review Queue</Link></li>
                  <li><Link href="/reports" className="block p-2 rounded hover:bg-gray-700">Reports</Link></li>
                </ul>
              </nav>
            </aside>
            <main className="flex-1 p-6 bg-gray-100">
              {children}
            </main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
