import React, { ReactNode, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Create a component that safely uses the search params
function FilterContent({ 
  children,
  originalListings,
  renderFiltered,
  emptyMessage = "No listings match your filter criteria. Try adjusting your filters."
}: FilterWrapperProps) {
  const searchParams = useSearchParams();
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const tradableOnly = searchParams.get('tradable') === 'true';
  
  const [filteredListings, setFilteredListings] = useState<any[] | null>(originalListings);
  
  // Calculate the number of active filters
  const filterCount = 
    (minPrice ? 1 : 0) + 
    (maxPrice ? 1 : 0) + 
    (tradableOnly ? 1 : 0);
  
  // Apply filters whenever the dependencies change
  useEffect(() => {
    if (!originalListings) {
      setFilteredListings(null);
      return;
    }
    
    // Apply filters to the original listings
    const filtered = originalListings.filter(listing => {
      // Apply min price filter if present
      if (minPrice && parseFloat(minPrice) > listing.price) {
        return false;
      }

      // Apply max price filter if present
      if (maxPrice && parseFloat(maxPrice) < listing.price) {
        return false;
      }

      // Filter by tradable if selected
      if (tradableOnly && !listing.openToTrade) {
        return false;
      }

      return true;
    });
    
    setFilteredListings(filtered);
  }, [originalListings, minPrice, maxPrice, tradableOnly]);
  
  // If filters are active but no listings match
  if (filterCount > 0 && filteredListings && filteredListings.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Filters applied: {filterCount}
          </p>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  // If a custom renderer for filtered results is provided
  if (filterCount > 0 && renderFiltered && filteredListings) {
    return <>{renderFiltered(filteredListings, filterCount)}</>;
  }
  
  // If there are filtered results or no filters are active, render children
  // This assumes the children component will render the listings
  return <>{children}</>;
}

interface FilterWrapperProps {
  children: ReactNode;
  originalListings: any[] | null;
  // When a custom renderer for filtered results is provided
  renderFiltered?: (filteredListings: any[], filterCount: number) => ReactNode;
  // Text to show when no listings match the filters
  emptyMessage?: string;
}

export function FilterWrapper(props: FilterWrapperProps) {
  //Yeah we have to use suspense boundary since Im pulling the params for the filters straight from the url
  //and it breaks without it only on vercel version
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <FilterContent {...props} />
    </Suspense>
  );
} 