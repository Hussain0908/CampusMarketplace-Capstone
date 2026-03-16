'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { StarIcon, Stars } from 'lucide-react'
import { toast } from 'sonner'

interface Review {
    user_id: string,    
    rating_point: string,    
    review_message: string,
    created_by: string,
}

export default function SellerRatingPage() {
  const router = useRouter()
  const { userid } = useParams() // Using useParams to get the seller's user ID
  const [seller, setSeller] = useState<any>(null)
  const [rating, setRating] = useState(0)  // Rating (1 to 5 stars)
  const [description, setDescription] = useState('') // Description text
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)  // To track if the user has already reviewed
  const supabase = createClient()

  useEffect(() => {
    async function fetchSellerData() {
      try {
        const { data: sellerData, error: sellerError } = await supabase
          .from('users')
          .select('user_id, first_name, last_name, profile_picture')
          .eq('user_id', userid)
          .single()

        if (sellerError) {
          console.error('Error fetching seller data:', sellerError)
          return
        }

        setSeller(sellerData)

      } catch (error) {
        console.error('Error:', error)
      }
    }

    async function checkIfReviewed() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          toast.error('Please sign in to check your review status')
          return
        }

        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .single()

        if (userDataError) throw userDataError

        // Check if this user has already reviewed this seller
        const { data: reviewData, error: reviewError } = await supabase
          .from('seller_reviews')
          .select('*')
          .eq('created_by', userData.user_id)
          .eq('user_id', userid)
          .single() // Fetch one record (since a user can only review a seller once)

        if (reviewError) {
          console.error('Error checking review:', reviewError)
          return
        }

        if (reviewData) {
          setHasReviewed(true)  // User has already reviewed this seller
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    if (userid) {
      fetchSellerData()
      checkIfReviewed()  // Check if the current user has already reviewed
    }
  }, [userid])

  const handleStarClick = (stars: number) => {
    setRating(stars)
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating!')
      return
    }
  
    if (!description) {
      toast.error('Please provide a description!')
      return
    }

    try {
      setIsSubmitting(true)
  
      const { data: { user }, error: userError } = await supabase.auth.getUser()
  
      if (userError || !user) {
        toast.error('Please sign in to submit a review')
        return
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user.email)
        .single()

      if (userDataError) throw userDataError

      const { data, error } = await supabase
        .from('seller_reviews')
        .insert([{
            user_id: userid,          // The seller's user ID
            rating_point: rating,     // The selected rating (stars)
            review_message: description, // The description written by the reviewer
            created_by: userData.user_id,      // The buyer's user ID
            created_on: new Date().toISOString(), // Current date and time
        }])
        .select()

      if (error) {
        console.error('Error submitting review:', error)
        toast.error('Failed to submit your review')
        return
      }

      toast.success('Review submitted successfully!')
      router.push(`/home/user/${userid}`) // Redirect to the seller's page
  
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!seller) {
    return <div>Loading seller data...</div>
  }

  if (hasReviewed) {
    return (
      <div className="container mx-auto p-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.back()}
        >
          Back
        </Button>

        <div className="flex items-center mb-6">
          <img
            src={seller.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.first_name} ${seller.last_name}`}
            alt="Seller avatar"
            className="h-24 w-24 rounded-full object-cover mr-4"
          />
          <div>
            <h1 className="text-2xl font-bold">{seller.first_name} {seller.last_name}</h1>
            <p className="text-sm text-gray-500">You have already reviewed this seller.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.back()}
      >
        Back
      </Button>

      <div className="flex items-center mb-6">
        <img
          src={seller.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.first_name} ${seller.last_name}`}
          alt="Seller avatar"
          className="h-24 w-24 rounded-full object-cover mr-4"
        />
        <div>
          <h1 className="text-2xl font-bold">{seller.first_name} {seller.last_name}</h1>
          <p className="text-sm text-gray-500">Rate this seller</p>
        </div>
      </div>

      <div className="mb-6">
        <div>
          <p className="text-xs text-gray-500">This field is required*</p>
          <h2 className="text-xl font-semibold mb-4">Select Rating</h2>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((stars) => (
            <StarIcon
              key={stars}
              onClick={() => handleStarClick(stars)}
              className={`h-8 w-8 cursor-pointer ${rating >= stars ? 'fill-yellow-400' : 'text-black-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div>
          <p className="text-xs text-gray-500">This field is required*</p>
          <h2 className="text-xl font-semibold mb-4">Write a Description</h2>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe your experience with the seller..."
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      <div className="mb-6">
        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  )
}
