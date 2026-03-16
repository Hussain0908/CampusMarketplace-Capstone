'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { createClient } from  '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ImagePlus, Trash, Wand2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useRouter } from 'next/navigation'
import OpenAI from 'openai'

interface ListingData {
  title: string
  price: string
  quantity: string
  category: string
  condition: string
  description: string
  images: string[]
  openToTrade: boolean
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
});

export default function CreateListing() {
  const router = useRouter()
  const supabase = createClient()
  const [listingData, setListingData] = useState<ListingData>({
    title: '',
    price: '',
    quantity: '',
    category: '',
    condition: '',
    description: '',
    images: [],
    openToTrade: false,
  })

  const titleCharCount = listingData.title.length
  const descriptionCharCount = listingData.description.length
  
  const titleCharLimit = 50
  const descriptionCharLimit = 400
  
  const isTitleOverLimit = titleCharCount > titleCharLimit
  const isDescriptionOverLimit = descriptionCharCount > descriptionCharLimit

  const handleChange = (
    field: keyof ListingData,
    value: string | string[] | boolean
  ) => {
    setListingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const newImages = files.slice(0, 5).map(file => URL.createObjectURL(file))
      handleChange('images', [...listingData.images, ...newImages].slice(0, 5))
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...listingData.images]
    newImages.splice(index, 1)
    handleChange('images', newImages)
  }

  const handleSubmit = async () => {
    try {
      // Validate all required fields
      if (!listingData.title) {
        toast.error('Title is required')
        return
      }
      
      if (!listingData.price) {
        toast.error('Price is required')
        return
      }
      
      if (!listingData.quantity) {
        toast.error('Please enter a quantity')
        return
      }
      if (!listingData.quantity || parseInt(listingData.quantity) <= 0) {
        toast.error('Quantity must be greater than 0')
        return
      }
      
      if (!listingData.category) {
        toast.error('Category is required')
        return
      }
      
      if (!listingData.condition) {
        toast.error('Condition is required')
        return
      }
      
      if (!listingData.description) {
        toast.error('Description is required')
        return
      }
      
      if (listingData.images.length === 0) {
        toast.error('At least one image is required')
        return
      }
      
      if (isTitleOverLimit) {
        toast.error(`Title exceeds ${titleCharLimit} character limit`)
        return
      }
      
      if (isDescriptionOverLimit) {
        toast.error(`Description exceeds ${descriptionCharLimit} character limit`)
        return
      }
  
      toast.info('Uploading images...')
      
      const imageUrls = await Promise.all(
        listingData.images.map(async (imageUrl) => {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
          
          const { data, error } = await supabase.storage
            .from('listing_images')
            .upload(fileName, blob)
            
          if (error) throw error
          
          const { data: { publicUrl } } = supabase.storage
            .from('listing_images')
            .getPublicUrl(data.path)
            
          return publicUrl
        })
      )

      toast.info('Creating listing...')

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('user_id, university_id')
        .eq('email', user?.email)
        .single()

      if (userDataError) throw userDataError

      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: userData.user_id,
          university_id: userData.university_id,
          title: listingData.title,
          description: listingData.description,
          price: parseFloat(listingData.price),
          quantity: parseInt(listingData.quantity),
          category: listingData.category,
          condition: listingData.condition,
          creation_date: new Date().toISOString(),
          is_active: true,
          image1: imageUrls[0] || null,
          image2: imageUrls[1] || null,
          image3: imageUrls[2] || null,
          image4: imageUrls[3] || null,
          image5: imageUrls[4] || null,
          openToTrade: listingData.openToTrade,
        })
        .select()

      if (error) throw error

      toast.success('Listing created successfully!')
      
      setTimeout(() => {
        router.push('/home/listings/my-listings')
      }, 1000)

    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('Error creating listing. Please try again.')
    }
  }


const generateAIDescription = async () => {
  if (!listingData.title) {
    toast.error('Please enter an item title first')
    return
  }

  if (!listingData.condition) {
    toast.error('Please select the item condition first')
    return
  }

  if (listingData.images.length === 0) {
    toast.error('Please upload at least one image first')
    return
  }

  try {
    toast.info('Generating description...')
    
    const imagePromises = listingData.images.map(async (imageUrl) => {
      const response = await fetch(imageUrl)
      const imageBlob = await response.blob()
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(imageBlob)
      })
    })

    const base64Images = await Promise.all(imagePromises)

    const messageContent = [
      { 
        type: "text", 
        text: `Generate a concise but detailed product description for this item. The item is titled "${listingData.title}" and is in "${listingData.condition}" condition. Focus on its appearance, condition, and notable features. Keep it under 400 characters. Make it a description of the item that would be found in a marketplace application like facebook marketplace or craigslist, something just to describe briefly what the item is and if there are any issues with it, its condition, etc.` 
      },
      ...base64Images.map(base64 => ({
        type: "image_url",
        image_url: {
          url: base64 as string
        }
      }))
    ]

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
      max_tokens: 300,
    })

    const description = aiResponse.choices[0]?.message?.content || ''
    handleChange('description', description)
    toast.success('Description generated!')
  } catch (error) {
    console.error('Error generating description:', error)
    toast.error('Failed to generate description')
  }
}


  return (
    <div className="container mx-auto py-8">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="space-y-4">
            {listingData.images.length > 0 && (
              <div className="relative w-full">
                <Carousel className="mx-12">
                  <CarouselContent>
                    {listingData.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`Item preview ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute -left-12" />
                  <CarouselNext className="absolute -right-12" />
                </Carousel>
              </div>
            )}
            <h3 className="text-lg font-medium">
              {listingData.title || 'Item Title'}
            </h3>
            <p className="text-2xl font-bold">
              {listingData.price ? `$${listingData.price}` : '$0.00'}
            </p>
            {listingData.category && (
              <p className="text-sm text-gray-500">
                Category: {listingData.category}
              </p>
            )}
             {listingData.quantity && (
              <p className="text-sm text-gray-500">
                Quantity: {listingData.quantity}
              </p>
            )}
            {listingData.condition && (
              <p className="text-sm text-gray-500">
                Condition: {listingData.condition}
              </p>
            )}
            <p className="text-gray-600">
              {listingData.description || 'Item description will appear here'}
            </p>
          </div>
        </Card>

        {/* Form Section */}
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-4">Fields marked with <span className="text-red-500">*</span> are required</p>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Photos (Up to 5) <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {[...Array(Math.min(5, listingData.images.length + 1))].map((_, index) => (
                  <div
                    key={index}
                    className="relative w-[120px] h-[120px] border-2 border-dashed rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                  >
                    {index < listingData.images.length?  (
                      <div>
                        <img
                          src={listingData.images[index]}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                          aria-label="Remove image"
                        >
                          <Trash className='w-4 h-4 text-red-500'/>
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <ImagePlus className="w-6 h-6 mb-1 text-gray-500" />
                          <p className="text-[10px] text-gray-500">Add photo</p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          multiple
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              {listingData.images.length > 0 && (
                <p className="text-sm text-gray-500">
                  {listingData.images.length}/5 photos
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="Enter item title"
                value={listingData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={isTitleOverLimit ? "border-red-500" : ""}
                required
              />
              <div className="flex justify-end">
                <p className={`text-xs ${isTitleOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {titleCharCount}/{titleCharLimit} characters
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price <span className="text-red-500">*</span></Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={listingData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                min={1} 
                value={listingData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => handleChange('category', value)}
                value={listingData.category}
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

            <div className="space-y-2">
              <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => handleChange('condition', value)}
                value={listingData.condition}
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


            <div className="flex items-center mb-4 required">
              <input id="default-checkbox" type="checkbox" checked={listingData.openToTrade} onChange={(e) => handleChange('openToTrade', e.target.checked)}  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
              <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Tradable</label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAIDescription}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  AI Generate
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe your item"
                value={listingData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`h-32 ${isDescriptionOverLimit ? "border-red-500" : ""}`}
                required
              />
              <div className="flex justify-end">
                <p className={`text-xs ${isDescriptionOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {descriptionCharCount}/{descriptionCharLimit} characters
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={isTitleOverLimit || isDescriptionOverLimit}
        >
          Create Listing
        </Button>
      </div>
    </div>
  )
}
