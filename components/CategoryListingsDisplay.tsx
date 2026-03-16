import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { FilterWrapper } from './FilterWrapper';

interface CategoryListingsDisplayProps {
  title: string;
  listings: any[] | null;
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  LoadingComponent?: React.ComponentType<any>;
}
//Made this component so that it can be reused for all the category pages, and also for the search results page
//Also gonna have to probably wrap all of the components in a Suspense boundary, beuase it works fine without it on dev
//but on prod this keeps breaking, kinda annoying but thats whats up in Next 15
export function CategoryListingsDisplay({
  title,
  listings,
  loading,
  error,
  emptyMessage = `No ${title.toLowerCase()} listings are available at the moment. Check back later!`,
  LoadingComponent
}: CategoryListingsDisplayProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        {LoadingComponent ? <LoadingComponent /> : <p>Loading...</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Render the listings with filter support
  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      
      <FilterWrapper 
        originalListings={listings}
        emptyMessage={`No ${title.toLowerCase()} listings match your filters. Try adjusting your criteria.`}
        renderFiltered={(filteredListings, filterCount) => (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {filteredListings.length} of {listings.length} items with {filterCount} filter{filterCount !== 1 ? 's' : ''} applied
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {renderListingCards(filteredListings, router)}
            </div>
          </>
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {renderListingCards(listings, router)}
        </div>
      </FilterWrapper>
    </div>
  );
}

// Helper function to render listing cards
function renderListingCards(listings: any[], router: any) {
  return listings.map((listing) => (
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
  ));
} 