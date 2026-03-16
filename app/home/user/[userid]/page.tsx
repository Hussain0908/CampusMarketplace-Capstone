'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'

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

interface Review {
  review_id: number,
  rating_point: number,
  review_message: string,
  created_by:{
    user_id: number,
    first_name: string,
    last_name: string,
    profile_picture: string | null,
  },
  created_on: string,
}

export default function UserProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [userListings, setUserListings] = useState<Listing[]>([])
  const [userReviews, setUserReviews] = useState<Review[]>([]) 
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id, first_name, last_name, profile_picture')
          .eq('user_id', params.userid)
          .single()

        if (userError) {
          console.error('Error fetching user profile:', userError)
          return
        }

        setUser(userData)

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
          .eq('user_id', params.userid) 
          .eq('is_active', true)
          .eq('sold', false)
          .order('creation_date', { ascending: false })

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
          return
        }

        setUserListings(listingsData)

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('seller_reviews')
          .select(`
            *,
            created_by (
              user_id,
              first_name,
              last_name,
              profile_picture
            )
          `)
          .eq('user_id', params.userid)
          .order('created_on', { ascending: false })

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)
          return
        }

        setUserReviews(reviewsData)
        
        // Calculate average rating
        if (reviewsData && reviewsData.length > 0) {
          const sum = reviewsData.reduce((acc, review) => acc + Number(review.rating_point), 0)
          const avg = sum / reviewsData.length
          setAverageRating(parseFloat(avg.toFixed(1)))
        }

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [params.userid])

  // Helper function to render stars based on rating, this will currenlty only fill out stars fully and not half or quarter (for average ratings that arent whole nunbers kidna thing)
  const renderStars = (rating: number | string) => {
    // Convert to number and ensure it's between 0 and 5
    const ratingValue = Math.min(Math.max(Math.round(Number(rating)), 0), 5);

    const filledStars = Array(ratingValue).fill('★');
    const emptyStars = Array(5 - ratingValue).fill('☆');

    return [...filledStars, ...emptyStars].map((star, index) => (
      <span key={index} className={star === '★' ? 'text-yellow-500' : 'text-gray-300'}>
        {star}
      </span>
    ));
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>User not found</div>
  }

  const showArrows = userReviews.length > 3;

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

      <div className="flex items-center mb-6">
        <img
          src={user.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover mr-4"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.first_name} {user.last_name}</h1>
          {averageRating !== null && (
            <div className="flex items-center mt-1">
              {renderStars(averageRating)}
            </div>
          )}
          {averageRating === null && (
            <div className="flex items-center mt-1">
              <span className="text-gray-500">No reviews yet</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Reviews</h2>

      {userReviews.length > 0 ? (
        <Carousel className="space-y-6" loop={false}>
          <CarouselContent>
            {userReviews.slice(0, Math.ceil(userReviews.length / 3)).map((_, index) => (
              <CarouselItem key={index} className="flex space-x-4">
                {userReviews.slice(index * 3, (index + 1) * 3).map((review, idx) => (
                  <div key={review.review_id} className="p-4 flex flex-col w-1/3">
                    <div className="flex items-center mb-4">
                      <img
                        src={review.created_by.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${review.created_by.first_name} ${review.created_by.last_name}`}
                        alt={`${review.created_by.first_name} ${review.created_by.last_name}`}
                        className="h-10 w-10 rounded-full object-cover mr-4"
                      />
                      <div>
                        <p className="font-semibold">{review.created_by.first_name} {review.created_by.last_name}</p>
                        <p className="text-sm text-gray-500">{renderStars(review.rating_point)}</p>
                      </div>
                    </div>
                    <p>{review.review_message}</p>
                  </div>
                ))}
              </CarouselItem>
            ))}
          </CarouselContent>
          {showArrows && (
            <>
              <CarouselPrevious className="absolute left-2" />
              <CarouselNext className="absolute right-2" />
            </>
          )}
        </Carousel>
      ) : (
        <p>No reviews available</p>
      )}

      {/* Listings Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Listings</h2>

      {userListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {userListings.map((listing) => (
            <Card
              key={listing.listing_id}
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow min-w-[280px] h-full"
              onClick={() => router.push(`/home/${listing.listing_id}`)} // Navigate to the listing detail page
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
      ) : (
        <p>No listings available</p>
      )}
    </div>
  )
}
