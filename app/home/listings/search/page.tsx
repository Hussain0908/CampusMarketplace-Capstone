'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ListingsGrid } from '@/components/ListingsGrid'
import { CategoryListingsDisplay } from '@/components/CategoryListingsDisplay'
import { toast } from "sonner"

function SearchResults() {
  const [listings, setListings] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const tradableOnly = searchParams.get('tradable') === 'true'
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query) {
        setListings([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
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

        if (userDataError) throw userDataError

        const currentUserId = userData.user_id
        
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocks')
          .select('blocker_user_id')
          .eq('blocked_user_id', currentUserId)

        if (blocksError) throw blocksError

        const blockedByUserIds = blocksData?.map(block => block.blocker_user_id) || []


        const searchPattern = `%${query}%`

        const baseQuery = supabase
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
          .eq('is_active', true)
          .eq('sold', false)
          .eq('users.university_id', userData.university_id)

        const { data: titleMatches, error: titleError } = await baseQuery
          .ilike('title', searchPattern)
          .order('creation_date', { ascending: false })

        if (titleError) throw titleError

        let descriptionMatches: any[] = []
        const titleIds = titleMatches?.map(item => item.listing_id) || []
        
        if (titleIds.length > 0) {
          const { data: descData, error: descError } = await baseQuery
            .ilike('description', searchPattern)
            .not('listing_id', 'in', `(${titleIds.join(',')})`)

          if (!descError) descriptionMatches = descData || []
        } else {
          const { data: descData, error: descError } = await baseQuery
            .ilike('description', searchPattern)

          if (!descError) descriptionMatches = descData || []
        }

        const combined = [...(titleMatches || []), ...descriptionMatches]
        
        const filteredResults = combined.filter((listing) => 
        listing.users.user_id !== currentUserId && !blockedByUserIds.includes(listing.users.user_id)
        )

        setListings(filteredResults)
      } catch (error) {
        console.error('Error searching listings:', error)
        toast.error('Failed to load search results')
        setError('Failed to load search results')
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, router])

  // Generate filter status message
  const filterStatus = [
    minPrice ? `Min $${minPrice}` : null,
    maxPrice ? `Max $${maxPrice}` : null,
    tradableOnly ? 'Tradable only' : null
  ].filter(Boolean).join(', ');

  return (
    <CategoryListingsDisplay
      title={`Search Results${query ? `: "${query}"` : ''}${filterStatus ? ` (${filterStatus})` : ''}`}
      listings={listings}
      loading={loading}
      error={error}
      emptyMessage={`No results found for "${query}". Try adjusting your search criteria.`}
      LoadingComponent={ListingsGrid}
    />
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ListingsGrid />}>
      <SearchResults />
    </Suspense>
  )
}