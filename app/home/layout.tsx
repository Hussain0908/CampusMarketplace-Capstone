import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import React from 'react'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>
      <div className="pt-16 flex flex-col md:flex-row">
        <div className="md:fixed md:left-0 md:h-[calc(100vh-4rem)] md:w-64">
          <Sidebar />
        </div>
        <div className="w-full md:ml-64 md:w-[calc(100%-16rem)]">
          <BreadcrumbNav />
          <main className="p-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 