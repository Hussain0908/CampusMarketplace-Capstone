'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ListingsGrid } from '@/components/ListingsGrid'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Toaster, toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Listing {
  listing_id: number
  title: string
  description: string
  price: number
  quantity: number | string 
  category: string
  condition: string
  creation_date: string
  is_active: boolean
  image1: string | null
  image2: string | null
  image3: string | null
  image4: string | null
  image5: string | null
  sold: boolean
  openToTrade: boolean
}

export default function MyListings() {
  const [listings, setListings] = useState<Listing[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const [editingListing, setEditingListing] = useState<Listing | null>(null)
  const [titleCharCount, setTitleCharCount] = useState(0)
  const [descriptionCharCount, setDescriptionCharCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'sold'>('active')
  const supabase = createClient()
  const router = useRouter()

  const titleCharLimit = 50
  const descriptionCharLimit = 400

  useEffect(() => {
    async function fetchListings() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        // Get user_id from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .single()

        if (userError) throw userError

        // Get user's listings
        const { data: listings, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userData.user_id)
          .order('creation_date', { ascending: false })

        if (error) throw error
        
        setListings(listings)
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    if (title.length <= titleCharLimit) {
      setEditingListing(prev => prev ? { ...prev, title } : null)
    }
    setTitleCharCount(title.length)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value
    if (description.length <= descriptionCharLimit) {
      setEditingListing(prev => prev ? { ...prev, description } : null)
    }
    setDescriptionCharCount(description.length)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingListing) {
      setEditingListing({ ...editingListing, [e.target.name]: e.target.value })
    }
  }

  const saveEdit = async () => {
    if (!editingListing) return
  
    const updates = {
      title: editingListing.title,
      description: editingListing.description,
      price: editingListing.price,
      category: editingListing.category,
      openToTrade: editingListing.openToTrade,
      quantity: editingListing.quantity,
      condition: editingListing.condition,
      is_active: editingListing.quantity > 0,
      sold: editingListing.quantity <= 0
    }
  
    try {
      await supabase.from('listings')
        .update(updates)
        .eq('listing_id', editingListing.listing_id)
  
      setListings((prev) =>
        prev?.map((listing) =>  listing.listing_id === editingListing.listing_id ?
         { ...editingListing, ...updates } : listing
        ) || null
      )

      setEditingListing(null)
    } catch (error) {
      console.error('Error updating listing:', error)
    }
  }

  const handleSaveEdit = () => {
    if (
      !editingListing?.title.trim() ||
      !editingListing?.price ||
      editingListing.quantity === null || editingListing.quantity === undefined||
      !editingListing?.category ||
      !editingListing?.condition ||
      !editingListing?.description.trim()
    ) {
      toast.error("Please fill in all required fields.")
      return
    }
    if (editingListing.quantity < 0) {
      toast.error("Quantity cannot be negative.")
      return
    }

    saveEdit()
  }

  const confirmDelete = async () => {
    if (!listingToDelete) return
    try {
      await supabase.from('listings').delete().eq('listing_id', listingToDelete.listing_id)
      setListings((prev) => prev?.filter((listing) => listing.listing_id !== listingToDelete.listing_id) || null)
    } catch (error) {
      console.error('Error deleting listing:', error)
    } finally {
      setListingToDelete(null)
    }
  }

  const updateListingStatus = async (listingId: number, updates: { is_active?: boolean, sold?: boolean }) => {
    try {
      await supabase.from('listings')
        .update(updates)
        .eq('listing_id', listingId)

      //IM just doing this so we can not have to make another api call to get its updated status, this should only even happen if 
      // supabase gets updated, should be fine
      setListings((prev) =>
        prev?.map((listing) =>
          listing.listing_id === listingId 
            ? { ...listing, ...updates } 
            : listing
        ) || null
      )
    } catch (error) {
      console.error('Error updating listing status:', error)
    }
  }

  const handleMarkAsSold = (listingId: number) => {
    updateListingStatus(listingId, { sold: true, is_active: false })
  }

  const handleActivate = (listingId: number) => {
    updateListingStatus(listingId, { is_active: true })
  }

  const handleDeactivate = (listingId: number) => {
    updateListingStatus(listingId, { is_active: false })
  }

  useEffect(() => {
    if (editingListing) {
      setTitleCharCount(editingListing.title.length);
      setDescriptionCharCount(editingListing.description.length);
    }
  }, [editingListing]);

  if (loading) {
    return <ListingsGrid />
  }

  if (!listings?.length) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">My Listings</h1>
        <p className="text-gray-500">You haven't created any listings yet.</p>
      </div>
    )
  }

  const activeListings = listings.filter(listing => listing.is_active && !listing.sold);
  const inactiveListings = listings.filter(listing => !listing.is_active && !listing.sold);
  const soldListings = listings.filter(listing => listing.sold);

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">My Listings</h1>
      
      <div className="flex space-x-2 mb-6">
        <Button 
          variant={activeTab === 'active' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('active')}
          className="flex-1"
        >
          Active ({activeListings.length})
        </Button>
        <Button 
          variant={activeTab === 'inactive' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('inactive')}
          className="flex-1"
        >
          Inactive ({inactiveListings.length})
        </Button>
        <Button 
          variant={activeTab === 'sold' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('sold')}
          className="flex-1"
        >
          Sold ({soldListings.length})
        </Button>
      </div>

      {activeTab === 'active' && activeListings.length === 0 && (
        <p className="text-gray-500 mb-6">You don't have any active listings.</p>
      )}
      
      {activeTab === 'inactive' && inactiveListings.length === 0 && (
        <p className="text-gray-500 mb-6">You don't have any inactive listings.</p>
      )}
      
      {activeTab === 'sold' && soldListings.length === 0 && (
        <p className="text-gray-500 mb-6">You don't have any sold listings.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {(activeTab === 'active' ? activeListings : 
          activeTab === 'inactive' ? inactiveListings : 
          soldListings).map((listing) => (
            <Card 
            key={listing.listing_id}
            className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative"
          >
          
            <div className="absolute top-2 right-2 z-10">
               <DropdownMenu>
                <DropdownMenuTrigger className="bg-gray-200 hover:bg-gray-300 rounded-full p-2">
                  <MoreVertical className="w-5 h-5 text-gray-600 hover:text-gray-800 " />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setEditingListing(listing)}> 
                    <Edit className="mr-2 w-5 h-5 text-gray-600" /> Edit
                  </DropdownMenuItem>
                  
                  {!listing.sold && listing.is_active && (
                    <>
                      <DropdownMenuItem onClick={() => handleMarkAsSold(listing.listing_id)}>
                        <span className="mr-2">🏷️</span> Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivate(listing.listing_id)}>
                        <span className="mr-2">🔌</span> Deactivate
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {!listing.sold && !listing.is_active && (
                    <>
                      <DropdownMenuItem onClick={() => handleMarkAsSold(listing.listing_id)}>
                        <span className="mr-2">🏷️</span> Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleActivate(listing.listing_id)}>
                        <span className="mr-2">⚡</span> Activate
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setListingToDelete(listing); }} 
                  className="text-red-600">
                     <Trash2 className="mr-2 w-5 h-5 text-red-600 " /> Delete 
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Status badge */}
            <div className="absolute top-2 left-2 z-10">
              {listing.sold && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  SOLD
                </span>
              )}
              {!listing.sold && !listing.is_active && (
                <span className="bg-gray-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  INACTIVE
                </span>
              )}
            </div>
            
            <div className="relative w-full aspect-square">
              <Carousel className="w-full">
                <CarouselContent>
                  {[listing.image1, listing.image2, listing.image3, listing.image4, listing.image5]
                    .filter(Boolean)
                    .map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-square">
                          <img
                            src={image!}
                            alt={`${listing.title} - Image ${index + 1}`}
                            className="object-cover w-full h-full rounded-t-lg"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2" />
                <CarouselNext className="absolute right-2" />
              </Carousel>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">{listing.title}</h2>
              <p className="text-2xl font-bold mb-2">${listing.price}</p>
              <p className="text-sm text-gray-500 mb-2">Qty: {listing.quantity}</p>
              <p className="text-sm text-gray-500 mb-2">Category: {listing.category}</p>
              <p className="text-sm text-gray-500 mb-2">Condition: {listing.condition}</p>
              <p className="text-sm text-gray-600 line-clamp-2"> {listing.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>

          {editingListing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title<span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  value={editingListing.title}
                  onChange={handleTitleChange}
                  required
                  className={titleCharCount > titleCharLimit ? 'border-red-500' : ''}
                />
                <div className="flex justify-end">
                  <p className={`text-xs ${titleCharCount > titleCharLimit ? 'text-red-500' : 'text-gray-500'}`}>
                    {titleCharCount}/{titleCharLimit} characters
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price<span className="text-red-500">*</span></Label>
                <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={editingListing.price}
                  onChange={handleEditChange}
                  required
                  className="pl-8"
                />
              </div>
              </div>

                    <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity<span className="text-red-500">*</span></Label>
                <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={editingListing.quantity === 0 ? '0' : editingListing.quantity || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditingListing((prev) =>
                  prev ? { ...prev, quantity: value === '' ? '' : parseInt(value) } : prev
                  );
                  }}
              required
                  />

                      </div>


                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition<span className="text-red-500">*</span></Label>
                    <Select
                      value={editingListing.condition}
                      onValueChange={(value) =>
                        setEditingListing((prev) => prev ? { ...prev, condition: value } : prev)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like-new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


              <div className="space-y-2">
                <Label htmlFor="category">Category<span className="text-red-500">*</span></Label>
                <Select
                  id="category"
                  value={editingListing.category}
                  onValueChange={(value) => handleEditChange({ target: { name: 'category', value } })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Textbooks">Textbooks</SelectItem>
                      <SelectItem value="School Supplies">School Supplies</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                      <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                      <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center mb-4 required">
                <input  id="openToTrade"  type="checkbox" checked={editingListing?.openToTrade || false}  onChange={(e) =>  setEditingListing((prev) => prev ? { ...prev, openToTrade: e.target.checked } : prev)}   className= "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor= "openToTrade" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Tradable </label>
                </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description<span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editingListing.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter item description"
                  required
                  className={descriptionCharCount > descriptionCharLimit ? 'border-red-500' : ''}
                  rows={5}
                />
                <div className="flex justify-end">
                  <p className={`text-xs ${descriptionCharCount > descriptionCharLimit ? 'text-red-500' : 'text-gray-500'}`}>
                    {descriptionCharCount}/{descriptionCharLimit} characters
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingListing(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={!!listingToDelete} onOpenChange={() => setListingToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListingToDelete(null)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

