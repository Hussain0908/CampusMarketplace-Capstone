'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { Button } from "@/components/ui/button"
import { BookmarkIcon, MessageSquare, ArrowLeft } from 'lucide-react'
import { toast } from "sonner"
import { useMessage } from '@/contexts/MessageContext'
import { TradeRequestButton } from '@/components/TradeRequestButton'


export default function ListingPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isOpenToTrade, setIsOpenToTrade] = useState(false); 
  const [isLoading, setIsLoading] = useState(true)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const { setSelectedUserId, setSelectedListingId, setIsPopoverOpen, setInitialListing } = useMessage()
  const supabase = createClient()

  useEffect(() => {
    async function fetchListing() {
      setIsLoading(true)
      const { data, error } = await supabase
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
        .eq('listing_id', params.id)
        .single()

      if (error) {
        console.error('Error fetching listing:', error)
        setIsLoading(false)
        return
      }

      setListing(data)
      setIsOpenToTrade(data.openToTrade)
      await checkIfSaved(data.listing_id)
      await fetchSellerRating(data.users.user_id)
      setIsLoading(false)
    }

    fetchListing()
  }, [params.id])

  const checkIfSaved = async (listingId: number) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return
      
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user.email)
        .single()
      
      if (userDataError) return
      
      const { data, error } = await supabase
        .from('saved_listings')
        .select('*')
        .eq('user_id', userData.user_id)
        .eq('listing_id', listingId)
        .single()
      
      if (data && !error) {
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error checking if listing is saved:', error)
    }
  }

  const fetchSellerRating = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('seller_reviews')
        .select('rating_point')
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error fetching seller ratings:', error)
        return
      }
      
      if (data && data.length > 0) {
        const sum = data.reduce((acc, review) => acc + Number(review.rating_point), 0)
        const avg = sum / data.length
        setAverageRating(parseFloat(avg.toFixed(1)))
      }
    } catch (error) {
      console.error('Error calculating average rating:', error)
    }
  }

  const handleMessageClick = (userId: number, listingId: number) => {
    setInitialListing({
      listing_id: listing.listing_id,
      title: listing.title,
      price: listing.price,
      image1: listing.image1
    });
    setSelectedUserId(userId);
    setSelectedListingId(listingId);
    setIsPopoverOpen(true);
  }

  const handleSaveClick = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Please sign in to save listings')
        return
      }

      // Get user_id from users table based on email
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user.email)
        .single()

      if (userDataError) {
        toast.error('Error fetching user data')
        console.error(userDataError)
        return
      }

      if (isSaved) {
        // Remove from saved listings
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', userData.user_id)
          .eq('listing_id', listing.listing_id)

        if (error) {
          toast.error('Failed to remove from saved listings')
          console.error(error)
          return
        }

        setIsSaved(false)
        toast.success('Removed from saved listings')
      } else {
        // Add to saved listings
        const { error } = await supabase
          .from('saved_listings')
          .insert({
            user_id: userData.user_id,
            listing_id: listing.listing_id
          })

        if (error) {
          toast.error('Failed to save listing')
          console.error(error)
          return
        }

        setIsSaved(true)
        toast.success('Listing saved successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  // Helper function to render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-sm">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(rating) ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        ))}
        <span className="ml-1 text-gray-600">({rating})</span>
      </div>
    )
  }

  if (isLoading || !listing) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Images */}
        <div className="relative aspect-square">
          <Carousel className="w-full h-full">
            <CarouselContent>
              {[listing.image1, listing.image2, listing.image3, listing.image4, listing.image5]
                .filter(Boolean)
                .map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square">
                      <img
                        src={image!}
                        alt={`${listing.title} - Image ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2" />
            <CarouselNext className="absolute right-2" />
          </Carousel>
        </div>

        {/* Right side - Details */}
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">
              {listing.title}
            </h2>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            ${listing.price}
          </p>
          <div className="bg-gray-100 px-3 py-1 rounded-full w-fit mb-4">
            <p className="text-sm text-gray-600">
              Category: {listing.category}
            </p>
          </div>
          
          {/* Action buttons moved above description and made smaller */}
          <div className="flex gap-3 mb-4">
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSaveClick}
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMessageClick(listing.users.user_id, listing.listing_id)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Seller
            </Button>
            {listing && isOpenToTrade && (
            <div>
              <TradeRequestButton
                listingId={listing.listing_id}
                className="w-full"
              />
            </div>
          )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded-full w-fit mb-4">
          <p className="text-sm text-gray-500">
          Qty: {listing.quantity}
            </p>
          </div>

          <div className="bg-gray-100 px-3 py-1 rounded-full w-fit mb-4">
            <p className="text-sm text-gray-600">
            Condition: {listing.condition}
            </p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={listing.users.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${listing.users.first_name} ${listing.users.last_name}`}
                alt="Seller avatar"
                className="h-10 w-10 rounded-full object-cover cursor-pointer"
                onClick={() => router.push(`/home/user/${listing.users.user_id}`)}
              />
              <div>
                <span
                  className="text-sm text-gray-600 cursor-pointer"
                  onClick={() => router.push(`/home/user/${listing.users.user_id}`)}
                >
                  {listing.users.first_name} {listing.users.last_name}
                </span>
                {averageRating !== null && (
                  <div className="flex items-center">
                    {renderStars(averageRating)}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Posted on: {new Date(listing.creation_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 