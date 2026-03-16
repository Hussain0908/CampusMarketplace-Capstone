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
import { ImagePlus, Wand2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useRouter } from 'next/navigation'
import OpenAI from 'openai'

interface ListingData {
  title: string
  price: string
  category: string
  condition: string
  description: string
  images: string[]
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
    category: '',
    condition: '',
    description: '',
    images: [],
  })

  // Calculate word counts
  const titleWordCount = listingData.title.trim().split(/\s+/).filter(Boolean).length
  const descriptionWordCount = listingData.description.trim().split(/\s+/).filter(Boolean).length
  
  const titleWordLimit = 20
  const descriptionWordLimit = 200
  
  const isTitleOverLimit = titleWordCount > titleWordLimit
  const isDescriptionOverLimit = descriptionWordCount > descriptionWordLimit

  const handleChange = (
    field: keyof ListingData,
    value: string | string[]
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

  const handleSubmit = async () => {
    try {
      if (isTitleOverLimit) {
        toast.error(`Title exceeds ${titleWordLimit} word limit`)
        return
      }
      
      if (isDescriptionOverLimit) {
        toast.error(`Description exceeds ${descriptionWordLimit} word limit`)
        return
      }
  
      toast.info('Uploading images...')
      //This whole function is just for preuploading the images to supabase cloud storage so wecan get back the url, and then 
      // we toss that url into the new listing record we make
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
          category: listingData.category,
          creation_date: new Date().toISOString(),
          is_active: true,
          image1: imageUrls[0] || null,
          image2: imageUrls[1] || null,
          image3: imageUrls[2] || null,
          image4: imageUrls[3] || null,
          image5: imageUrls[4] || null,
        })
        .select()

      if (error) throw error

      toast.success('Listing created successfully!')
      //Give it a small delay to account for the time it takes for the record to be made, so the user can see it when redirected
      setTimeout(() => {
        router.push('/listings/my-listings')
      }, 1000)

    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('Error creating listing. Please try again.')
    }
  }


const generateAIDescription = async () => {
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
    //We gotta convert them to base 64 so the ai can read them
    const base64Images = await Promise.all(imagePromises)
 
    const messageContent = [
      { 
        type: "text", 
        text: "Generate a concise but detailed product description for this item. Focus on its appearance, condition, and notable features. Keep it under 50 words. Make it a description of the item that would be found in a marketplace application like facebook marketplace or craigslist, something just to describe briefly what the item is and if there are any issues with it, its condition, etc." 
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
                        <div className="relative w-full aspect-video overflow-hidden rounded-lg">
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
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Photos (Up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {[...Array(Math.min(5, listingData.images.length + 1))].map((_, index) => (
                  <div
                    key={index}
                    className="relative w-[120px] h-[120px] border-2 border-dashed rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                  >
                    {index < listingData.images.length ? (
                      <img
                        src={listingData.images[index]}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter item title"
                value={listingData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={isTitleOverLimit ? "border-red-500" : ""}
              />
              <div className="flex justify-end">
                <p className={`text-xs ${isTitleOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {titleWordCount}/{titleWordLimit} words
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={listingData.price}
                onChange={(e) => handleChange('price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => handleChange('category', value)}
                value={listingData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                onValueChange={(value) => handleChange('condition', value)}
                value={listingData.condition}
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
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description</Label>
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
              />
              <div className="flex justify-end">
                <p className={`text-xs ${isDescriptionOverLimit ? "text-red-500" : "text-gray-500"}`}>
                  {descriptionWordCount}/{descriptionWordLimit} words
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
