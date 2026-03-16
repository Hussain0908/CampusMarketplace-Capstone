"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
interface Trade {
  trade_id: number;
  requester_user_id: number;
  receiver_user_id: number;
  requester_item_id: number;
  receiver_item_id: number;
  created_on: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requester: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
  receiver: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
  requester_item: {
    listing_id: number;
    title: string;
    price: number;
    image1: string | null;
  };
  receiver_item: {
    listing_id: number;
    title: string;
    price: number;
    image1: string | null;
  };
}
interface Listing {
  listing_id: number;
  title: string;
  users: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture: string | null;
  };
}
export default function RequestTradePage() {
  const router = useRouter();
  const supabase = createClient();
  const params = useParams();
  const listingId = params?.listingId ? String(params.listingId) : null;
  const [receiverUserId, setReceiverUserId] = useState<string | null>(null);
  const [listingDetails, setListingDetails] = useState<any>(null);
  const [userItems, setUserItems] = useState<Listing[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Fetch the listing details (the item user clicked on)
  useEffect(() => {
    async function fetchListingDetails() {
      if (!listingId) return;
      
      const { data, error } = await supabase
        .from("listings")
        .select("title, description, image1, user_id")
        .eq("listing_id", listingId)
        .single();
      if (error) {
        console.error("Error fetching listing details:", error);
        return;
      }
      setListingDetails(data);
      setReceiverUserId(data.user_id);
    }
    fetchListingDetails();
  }, [listingId]);
  // Fetch the user's own tradeable items
  useEffect(() => {
    async function fetchUserItems() {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("user_id")
          .eq('email', user.email)
          .single();
        if (userDataError || !userData) {
          console.error("Error fetching user data:", userDataError);
          return;
        }
        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select(`
            listing_id,
            title,
            users (
              user_id,
              first_name,
              last_name,
              profile_picture
            )
          `)
          .eq("user_id", userData.user_id)
          .eq("openToTrade", true)
          .eq("sold", false);
        if (listingsError) {
          console.error("Error fetching listings:", listingsError);
          return;
        }
        setUserItems(listingsData || []);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserItems();
  }, []);
  // Handle trade request submission
  const handleTradeRequest = async () => {
    if (!receiverUserId || !selectedItemId) return;
    setIsSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Authentication error");
      }
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('user_id, university_id, first_name, last_name')
        .eq('email', user.email)
        .single()
      if (userDataError) throw userDataError
      
      // Get receiver item details for notification
      const { data: receiverItem } = await supabase
        .from('listings')
        .select('title')
        .eq('listing_id', listingId)
        .single();
        
      // Get requester item details for notification
      const { data: requesterItem } = await supabase
        .from('listings')
        .select('title')
        .eq('listing_id', selectedItemId)
        .single();
      
      // Create the trade
      const { data, error } = await supabase
        .from('trades')
        .insert([
          {
            requester_user_id: userData.user_id,
            receiver_user_id: receiverUserId,
            requester_item_id: selectedItemId,
            receiver_item_id: listingId,
            created_on: new Date().toISOString(),
            status: "Pending",
            comments: comment.trim() || null,
          }
        ]);
      if (error) throw error;
      
      // Create notification for the receiver
      const notificationContent = `${userData.first_name} ${userData.last_name} wants to trade their "${requesterItem.title}" for your "${receiverItem.title}"`;
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            content: notificationContent,
            status: 'Sent',
            created_at: new Date().toISOString(),
            user_id: receiverUserId
          }
        ]);
        
      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
      
      router.push("/home/trade-requests");
    } catch (error) {
      console.error("Error sending trade request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Request a Trade</h1>
      {listingDetails && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{listingDetails.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {listingDetails.image1 && (
              <div className="aspect-square w-full mb-2 overflow-hidden rounded-lg">
                <img 
                  src={listingDetails.image1} 
                  alt={listingDetails.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            <p className="text-gray-600">Description: {listingDetails.description}</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 required">Select Your Item *</label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              {userItems.map((item) => (
                <SelectItem key={item.listing_id} value={String(item.listing_id)}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Comment</label>
          <Textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={250}
            className="min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleTradeRequest}
          disabled={!selectedItemId || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Send Trade Request"}
        </Button>
      </div>
    </div>
  );
}