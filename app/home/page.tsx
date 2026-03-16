'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Button } from "@/components/ui/button"
import { BookmarkIcon, MessageSquare } from 'lucide-react'
import { toast } from "sonner"
import { ListingsGrid } from '@/components/ListingsGrid'
import { useMessage } from '@/contexts/MessageContext'
import { useRouter } from 'next/navigation'

interface Listing {
  listing_id: number
  title: string
  description: string
  price: number
  category: string
  creation_date: string
  is_active: boolean
  image1: string | null
  image2: string | null
  image3: string | null
  image4: string | null
  image5: string | null
  users: {
    user_id: number
    first_name: string
    last_name: string
    profile_picture: string | null
  }
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const { setSelectedUserId, setIsPopoverOpen } = useMessage()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('user_id, university_id')
          .eq('email', user.email)
          .single()

        if (userDataError) {
          console.error('Error fetching user data:', userDataError)
          return
        }

        const currentUserId = userData.user_id
        const universityId = userData.university_id

        const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('blocker_user_id')
        .eq('blocked_user_id', currentUserId);
   
        if (blocksError) {
          console.error('Error fetching blocks:', blocksError)
        }
        const blockedBy = blocksData?.map((block: { blocker_user_id: number }) => block.blocker_user_id) || []


        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            users (
              user_id,
              first_name,
              last_name,
              profile_picture
            )
          `)
          .eq('university_id', userData.university_id)
          .eq('is_active', true)
          .eq('sold', false)
          .order('creation_date', { ascending: false })

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
          return
        }

        const filteredListings = listingsData.filter((listing: Listing) =>
        listing.users.user_id !== currentUserId && !blockedBy.includes(listing.users.user_id)
      );

        setListings(filteredListings)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const handleMessageClick = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation()
    setSelectedUserId(userId)
    setIsPopoverOpen(true)
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.info('Save functionality coming soon!')
  }

  if (loading) {
    return <ListingsGrid />
  }
  if (listings.length === 0) {
    return (
      <div className="flex-1 p-6">
        <p className="text-gray-500">No listings in your university are available at the moment. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="w-full p-4 space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <Card 
              key={listing.listing_id} 
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow w-full min-w-[140px]"
              onClick={() => router.push(`/home/${listing.listing_id}`)}
            >
              <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
                <img
                  src={listing.image1 || '/default-image.jpg'}
                  alt={listing.title}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
              <div className="p-2">
                <h2 className="text-sm font-semibold mb-1">{listing.title}</h2>
                <p className="text-lg font-bold">${listing.price}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
