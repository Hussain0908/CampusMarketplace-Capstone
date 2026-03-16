import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

// Define the listing type for type safety
interface Listing {
  listing_id: number;
  title: string;
  price: number;
  description?: string;
  category?: string;
  image1?: string | null;
  openToTrade?: boolean;
  [key: string]: any; // Allow for additional fields
}

/**
 * A custom hook for filtering listings by price and trade status.
 * Automatically reads filter values from URL query parameters.
 */
export function useListingsFilter<T extends Listing>(listings: T[] | null) {
  const searchParams = useSearchParams();
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const tradableOnly = searchParams.get('tradable') === 'true';

  // Apply filters to listings
  const filteredListings = useMemo(() => {
    if (!listings) return null;

    return listings.filter(listing => {
      // Apply min price filter if present
      if (minPrice && parseFloat(minPrice) > listing.price) {
        return false;
      }

      // Apply max price filter if present
      if (maxPrice && parseFloat(maxPrice) < listing.price) {
        return false;
      }

      // Filter by tradable if selected
      if (tradableOnly && listing.openToTrade === false) {
        return false;
      }

      return true;
    });
  }, [listings, minPrice, maxPrice, tradableOnly]);

  const filterActive = !!(minPrice || maxPrice || tradableOnly);

  return {
    filteredListings,
    filterActive,
    filterCount: 
      (minPrice ? 1 : 0) + 
      (maxPrice ? 1 : 0) + 
      (tradableOnly ? 1 : 0)
  };
} 