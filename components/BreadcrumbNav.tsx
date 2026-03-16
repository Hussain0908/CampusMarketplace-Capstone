'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from 'lucide-react'
import React from 'react'

export function BreadcrumbNav() {
  const pathname = usePathname()
  
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null
  }
  
  const pathSegments = pathname.split('/').filter(Boolean)
  
  const formatSegment = (segment: string) => {
    if (segment === 'home') return 'Home'
    //Had to use this stupid regex to since we pass the id in the url, and it wasnt making sense what the breadcrumb is for when i just put the number
    // So i made this to instead show "Details" in the case it was a listing ID that it grabbed from the url.
    if (/^\d+$/.test(segment)) {
      return 'Details'
    }
    
    return segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
  
  const isHomePage = pathname === '/home'
  
  const filteredSegments = pathSegments.filter((segment, index) => 
    !(segment === 'home' && index === 0)
  )
  
  return (
    <Breadcrumb className="px-6 py-3 bg-white border-b">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/home">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {!isHomePage && filteredSegments.length > 0 && (
          <>
            {filteredSegments.map((segment, index) => {
              const segmentPath = `/${pathSegments.slice(0, pathSegments.indexOf(segment) + 1).join('/')}`
              const isLastSegment = index === filteredSegments.length - 1
              //This one is cause we dont actually have a listings page under "?/home/listings", so im having it redirect to home if they click that
              const href = segment === 'listings' ? '/home' : segmentPath
              
              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLastSegment ? (
                      <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{formatSegment(segment)}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 