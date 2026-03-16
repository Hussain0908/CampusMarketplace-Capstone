"use client"

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useCallback, memo } from 'react'
import { 
  Plus,
  Bed,
  Laptop,
  BookOpen,
  Pencil,
  Shirt,
  Smartphone,
  Dumbbell,
  Music,
  Menu,
  Bookmark,
  Search,
  Package,
  Repeat,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

const categories = [
  { name: 'Dorm Furniture', href: '/home/listings/dorm-furniture', icon: Bed },
  { name: 'Technology', href: '/home/listings/technology', icon: Laptop },
  { name: 'Textbooks', href: '/home/listings/textbooks', icon: BookOpen },
  { name: 'School Supplies', href: '/home/listings/school-supplies', icon: Pencil },
  { name: 'Clothing', href: '/home/listings/clothing', icon: Shirt },
  { name: 'Sports Equipment', href: '/home/listings/sports', icon: Dumbbell },
  { name: 'Musical Instruments', href: '/home/listings/music', icon: Music },
  { name: 'Other', href: '/home/listings/other', icon: Package },
]

const personalCategories = [
  { name: 'My Listings', href: '/home/listings/my-listings', icon: Menu },
  { name: 'Saved Listings', href: '/home/listings/saved-listings', icon: Bookmark },
  { name: 'Trade Requests', href: '/home/trade-requests', icon: Repeat },
]

// Type definitions
interface FilterSectionProps {
  initialMinPrice: string;
  initialMaxPrice: string;
  initialTradableOnly: boolean;
  onApplyFilters: (filters: FilterValues) => void;
  onResetFilters: () => void;
}

interface FilterValues {
  minPrice: string;
  maxPrice: string;
  tradableOnly: boolean;
}

interface CategoryListProps {
  pathname: string;
  onCloseSidebar: () => void;
}

// Extracted FilterSection as a separate component to prevent unnecessary re-renders
const FilterSection = memo<FilterSectionProps>(({ 
  initialMinPrice,
  initialMaxPrice,
  initialTradableOnly,
  onApplyFilters,
  onResetFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [formState, setFormState] = useState({
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    tradableOnly: initialTradableOnly
  });

  // Update local form state when props change (from URL)
  useEffect(() => {
    setFormState({
      minPrice: initialMinPrice,
      maxPrice: initialMaxPrice,
      tradableOnly: initialTradableOnly
    });
  }, [initialMinPrice, initialMaxPrice, initialTradableOnly]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [id === 'min-price' ? 'minPrice' : 'maxPrice']: value
    }));
  };

  const handleTradableChange = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      tradableOnly: checked
    }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(formState);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormState({
      minPrice: '',
      maxPrice: '',
      tradableOnly: false
    });
    onResetFilters();
  };

  return (
    <div className="mt-2 mb-4">
      <button 
        onClick={() => setShowFilters(!showFilters)} 
        className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded"
      >
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          <span>Filters</span>
        </div>
        {showFilters ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showFilters && (
        <form onSubmit={handleApply} className="p-3 border rounded-md mt-2 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="min-price" className="text-xs">Min Price ($)</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={formState.minPrice}
              onChange={handleInputChange}
              className="h-8 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-price" className="text-xs">Max Price ($)</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="Any"
              value={formState.maxPrice}
              onChange={handleInputChange}
              className="h-8 text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox 
              id="tradable" 
              checked={formState.tradableOnly}
              onCheckedChange={handleTradableChange}
            />
            <Label 
              htmlFor="tradable" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tradable Only
            </Label>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="text-xs h-8">
              Reset
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8">
              Apply Filters
            </Button>
          </div>
        </form>
      )}
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

// CategoryList component, had to abstract this whole thing out to its own component to prevent the sidebar from breaking on prod
const CategoryList = memo<CategoryListProps>(({ pathname, onCloseSidebar }) => (
  <div className="space-y-2">
    {categories.map((category) => {
      const Icon = category.icon
      const isActive = pathname === category.href
      return (
        <Button
          key={category.href}
          variant="ghost"
          asChild
          className={`w-full justify-start py-3 px-4 ${
            isActive 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'hover:bg-blue-50'
          }`}
          onClick={onCloseSidebar}
        >
          <Link href={category.href} className="flex items-center">
            <Icon className="mr-3 h-5 w-5" />
            <span className="text-base">{category.name}</span>
          </Link>
        </Button>
      )
    })}
    
    <div className="my-4 border-t pt-4">
      {personalCategories.map((category) => {
        const Icon = category.icon
        const isActive = pathname === category.href
        return (
          <Button
            key={category.href}
            variant="ghost"
            asChild
            className={`w-full justify-start py-3 px-4 ${
              isActive 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'hover:bg-blue-50'
            }`}
            onClick={onCloseSidebar}
          >
            <Link href={category.href} className="flex items-center">
              <Icon className="mr-3 h-5 w-5" />
              <span className="text-base">{category.name}</span>
            </Link>
          </Button>
        )
      })}
    </div>
  </div>
));

CategoryList.displayName = 'CategoryList';
//another abstraction to prevent the sidebar from breaking on prod
function MarketplaceSidebarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [tradableOnly, setTradableOnly] = useState(false)
  const router = useRouter()

  // Initialize filter values from URL on component mount
  useEffect(() => {
    if (pathname.includes('/home/listings')) {
      setSearchQuery(searchParams.get('q') || '')
      setMinPrice(searchParams.get('minPrice') || '')
      setMaxPrice(searchParams.get('maxPrice') || '')
      setTradableOnly(searchParams.get('tradable') === 'true')
    }
  }, [pathname, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const params = new URLSearchParams()
      params.set('q', searchQuery.trim())
      
      // Add filter parameters if they exist
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (tradableOnly) params.set('tradable', 'true')
      
      router.push(`/home/listings/search?${params.toString()}`)
    }
  }

  const handleCloseSidebar = useCallback(() => {
    setIsOpen(false)
  }, []);

  const applyFilters = useCallback((filterValues: FilterValues) => {
    const { minPrice: newMinPrice, maxPrice: newMaxPrice, tradableOnly: newTradableOnly } = filterValues;
    
    // Update parent state
    setMinPrice(newMinPrice);
    setMaxPrice(newMaxPrice);
    setTradableOnly(newTradableOnly);
    
    // Check if on home page or filterable listing pages
    const isFilterablePage = pathname === '/' || pathname === '/home' || 
      (pathname.includes('/home/listings/') && 
      !pathname.includes('/home/listings/my-listings') && 
      !pathname.includes('/home/listings/saved-listings'));
    
    if (isFilterablePage) {
      const params = new URLSearchParams(searchParams.toString());
      
      // Update filter parameters
      if (newMinPrice) {
        params.set('minPrice', newMinPrice);
      } else {
        params.delete('minPrice');
      }
      
      if (newMaxPrice) {
        params.set('maxPrice', newMaxPrice);
      } else {
        params.delete('maxPrice');
      }
      
      if (newTradableOnly) {
        params.set('tradable', 'true');
      } else {
        params.delete('tradable');
      }
      
      // Keep the search query parameter if on search page
      if (!pathname.includes('/home/listings/search')) {
        params.delete('q');
      }
      
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams]);

  const resetFilters = useCallback(() => {
    setMinPrice('');
    setMaxPrice('');
    setTradableOnly(false);
    
    // Check if on home page or filterable listing pages, wish there was a better way to do this
    const isFilterablePage = pathname === '/' || pathname === '/home' || 
      (pathname.includes('/home/listings/') && 
      !pathname.includes('/home/listings/my-listings') && 
      !pathname.includes('/home/listings/saved-listings'));
    
    if (isFilterablePage) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('minPrice');
      params.delete('maxPrice');
      params.delete('tradable');
      
      // Keep the search query parameter if on search page
      if (!pathname.includes('/home/listings/search')) {
        params.delete('q');
      }
      
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [pathname, router, searchParams]);

  return (
    <>
      <div className="md:hidden p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search your marketplace" 
              className="w-full pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
                <Menu className="h-4 w-4" />
                All Categories
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="mt-6 h-[calc(100vh-100px)]">
                <ScrollArea className="h-full">
                  <CategoryList pathname={pathname} onCloseSidebar={handleCloseSidebar} />
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <FilterSection 
          initialMinPrice={minPrice}
          initialMaxPrice={maxPrice}
          initialTradableOnly={tradableOnly}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
        />
        <Button className="w-full py-6" asChild>
          <Link href="/home/create-listing">
            <Plus className="mr-2 h-5 w-5" />
            Create Listing
          </Link>
        </Button>
      </div>

      <SidebarProvider defaultOpen={true}>
        <UISidebar collapsible="none" className="hidden md:flex w-64 border-r">
          <SidebarHeader className="border-b px-6 py-4">
            <h1 className="text-xl font-bold">Marketplace</h1>
          </SidebarHeader>
          <SidebarContent className="flex flex-col">
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4">
                <form onSubmit={handleSearch} className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search your marketplace" 
                    className="w-full pl-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <FilterSection 
                  initialMinPrice={minPrice}
                  initialMaxPrice={maxPrice}
                  initialTradableOnly={tradableOnly}
                  onApplyFilters={applyFilters}
                  onResetFilters={resetFilters}
                />
                <Button className="w-full py-6" asChild>
                  <Link href="/home/create-listing">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Listing
                  </Link>
                </Button>
              </div>
              <SidebarMenu className="space-y-2 px-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  const isActive = pathname === category.href
                  return (
                    <SidebarMenuItem key={category.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`py-3 px-4 w-full transition-colors ${
                          isActive 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <Link href={category.href} className="flex items-center">
                          <Icon className="mr-3 h-5 w-5" />
                          <span className="text-base">{category.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
                
                <div className="my-4 border-t pt-4">
                  {personalCategories.map((category) => {
                    const Icon = category.icon
                    const isActive = pathname === category.href
                    return (
                      <SidebarMenuItem key={category.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`py-3 px-4 w-full transition-colors ${
                            isActive 
                              ? 'bg-blue-500 text-white hover:bg-blue-600' 
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <Link href={category.href} className="flex items-center">
                            <Icon className="mr-3 h-5 w-5" />
                            <span className="text-base">{category.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </div>
              </SidebarMenu>
            </ScrollArea>
          </SidebarContent>
        </UISidebar>
      </SidebarProvider>
    </>
  )
}

export default function MarketplaceSidebar() {
  return (
    //again using suspense boundary to prevent the sidebar from breaking on prod
    <Suspense fallback={<div className="p-4 flex justify-center items-center h-screen">Loading sidebar...</div>}>
      <MarketplaceSidebarContent />
    </Suspense>
  );
}