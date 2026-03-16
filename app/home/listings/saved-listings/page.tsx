'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from "@/components/ui/card"
import { ListingsGrid } from '@/components/ListingsGrid'

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

export default function SavedListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchSavedListings() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get user_id from users table based on email
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .single()

        if (userDataError) {
          console.error('Error fetching user data:', userDataError)
          return
        }

        // Get saved listings IDs
        const { data: savedListingsData, error: savedListingsError } = await supabase
          .from('saved_listings')
          .select('listing_id')
          .eq('user_id', userData.user_id)

        if (savedListingsError) {
          console.error('Error fetching saved listings:', savedListingsError)
          return
        }

        if (savedListingsData.length === 0) {
          setListings([])
          setLoading(false)
          return
        }

        // Extract listing IDs
        const listingIds = savedListingsData.map(item => item.listing_id)

        // Fetch the actual listings
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
          .in('listing_id', listingIds)
          .eq('is_active', true)
          .eq('sold', false)
          .order('creation_date', { ascending: false })

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
          return
        }

        setListings(listingsData)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Failed to load saved listings')
      } finally {
        setLoading(false)
      }
    }

    fetchSavedListings()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Saved Listings</h1>
        <ListingsGrid />
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Saved Listings</h1>
        <p className="text-gray-500">You haven't saved any listings yet.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Listings</h1>
      <div className="w-full space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {listings.map((listing: Listing) => (
            <Card 
              key={listing.listing_id} 
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow min-w-[280px]"
              onClick={() => router.push(`/home/${listing.listing_id}`)}
            >
              <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
                <img
                  src={listing.image1 || '/default-image.jpg'}
                  alt={listing.title}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{listing.title}</h2>
                <p className="text-2xl font-bold">${listing.price}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}