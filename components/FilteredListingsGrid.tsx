import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useListingsFilter } from '@/utils/useListingsFilter';

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

interface FilteredListingsGridProps {
  listings: Listing[] | null;
  title: string;
  emptyMessage?: string;
}

export function FilteredListingsGrid({ 
  listings, 
  title, 
  emptyMessage = "No listings are available with the current filters."
}: FilteredListingsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filteredListings, filterActive, filterCount } = useListingsFilter(listings);
  
  // Handle the case when there are no listings or they're still loading
  if (!listings || listings.length === 0) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <p className="text-gray-500">No listings available at the moment. Check back later!</p>
      </div>
    );
  }

  // If we have listings but none match the filters
  if (filteredListings && filteredListings.length === 0 && filterActive) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="mb-4">
          {filterCount > 0 && (
            <p className="text-sm text-gray-500">
              Filters applied: {filterCount}
            </p>
          )}
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {filterCount > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredListings?.length} of {listings.length} items with filters applied
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredListings?.map((listing) => (
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
              {listing.openToTrade && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                  Tradable
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">{listing.title}</h2>
              <p className="text-2xl font-bold">${listing.price}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 