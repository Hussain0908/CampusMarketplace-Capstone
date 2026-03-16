'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { useMessage } from '@/contexts/MessageContext'

interface Trade {
  trade_id: number
  requester_user_id: number
  receiver_user_id: number
  requester_item_id: number
  receiver_item_id: number
  created_on: string
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed'
  comments?: string
  requester: {
    user_id: number
    first_name: string
    last_name: string
    profile_picture: string | null
  }
  receiver: {
    user_id: number
    first_name: string
    last_name: string
    profile_picture: string | null
  }
  requester_item: {
    listing_id: number
    title: string
    price: number
    image1: string | null
  }
  receiver_item: {
    listing_id: number
    title: string
    price: number
    image1: string | null
  }
}

export default function TradeRequestsPage() {
  const [incomingTrades, setIncomingTrades] = useState<Trade[]>([])
  const [outgoingTrades, setOutgoingTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const supabase = createClient()
  const router = useRouter()
  
  // Add the message context
  const { setSelectedUserId, setIsPopoverOpen } = useMessage()

  // Filter trades by status for the completed tab
  const pendingIncomingTrades = incomingTrades.filter(trade => 
    trade.status === 'Pending'
  )
  
  const pendingOutgoingTrades = outgoingTrades.filter(trade => 
    trade.status === 'Pending'
  )
  
  const completedIncomingTrades = incomingTrades.filter(trade => 
    trade.status === 'Accepted' || trade.status === 'Declined'
  )
  
  const completedOutgoingTrades = outgoingTrades.filter(trade => 
    trade.status === 'Accepted' || trade.status === 'Declined'
  )

  useEffect(() => {
    async function fetchTrades() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get user ID
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .single()

        if (userDataError) {
          console.error('Error fetching user data:', userDataError)
          return
        }

        setCurrentUserId(userData.user_id)

        // Fetch incoming trade requests with manual joins
        const { data: incomingData, error: incomingError } = await supabase
          .from('trades')
          .select('*')
          .eq('receiver_user_id', userData.user_id)
          .order('created_on', { ascending: false })

        if (incomingError) {
          console.error('Error fetching incoming trades:', incomingError)
        } else {
          // Fetch related data for each trade
          const tradesWithDetails = await Promise.all(incomingData.map(async (trade) => {
            // Get requester details
            const { data: requester } = await supabase
              .from('users')
              .select('user_id, first_name, last_name, profile_picture')
              .eq('user_id', trade.requester_user_id)
              .single()
            
            // Get receiver details
            const { data: receiver } = await supabase
              .from('users')
              .select('user_id, first_name, last_name, profile_picture')
              .eq('user_id', trade.receiver_user_id)
              .single()
            
            // Get requester item details
            const { data: requesterItem } = await supabase
              .from('listings')
              .select('listing_id, title, price, image1')
              .eq('listing_id', trade.requester_item_id)
              .single()
            
            // Get receiver item details
            const { data: receiverItem } = await supabase
              .from('listings')
              .select('listing_id, title, price, image1')
              .eq('listing_id', trade.receiver_item_id)
              .single()
            
            return {
              ...trade,
              requester,
              receiver,
              requester_item: requesterItem,
              receiver_item: receiverItem
            }
          }))
          
          setIncomingTrades(tradesWithDetails)
        }

        // Fetch outgoing trade requests with manual joins
        const { data: outgoingData, error: outgoingError } = await supabase
          .from('trades')
          .select('*')
          .eq('requester_user_id', userData.user_id)
          .order('created_on', { ascending: false })

        if (outgoingError) {
          console.error('Error fetching outgoing trades:', outgoingError)
        } else {
          // Fetch related data for each trade
          const tradesWithDetails = await Promise.all(outgoingData.map(async (trade) => {
            // Get requester details
            const { data: requester } = await supabase
              .from('users')
              .select('user_id, first_name, last_name, profile_picture')
              .eq('user_id', trade.requester_user_id)
              .single()
            
            // Get receiver details
            const { data: receiver } = await supabase
              .from('users')
              .select('user_id, first_name, last_name, profile_picture')
              .eq('user_id', trade.receiver_user_id)
              .single()
            
            // Get requester item details
            const { data: requesterItem } = await supabase
              .from('listings')
              .select('listing_id, title, price, image1, sold')
              .eq('listing_id', trade.requester_item_id)
              .single()
            
            // Get receiver item details
            const { data: receiverItem } = await supabase
              .from('listings')
              .select('listing_id, title, price, image1, sold')
              .eq('listing_id', trade.receiver_item_id)
              .single()
            
            return {
              ...trade,
              requester,
              receiver,
              requester_item: requesterItem,
              receiver_item: receiverItem
            }
          }))
          
          setOutgoingTrades(tradesWithDetails)
        }

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [])

  const handleAcceptTrade = async (tradeId: number) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'Accepted' })
        .eq('trade_id', tradeId)

      if (error) {
        console.error('Error Updating Satus:', error)
        return
      }

      const { data: tradeData, error: tradeError} = await supabase
        .from('trades')
        .select('requester_item_id, receiver_item_id')
        .eq('trade_id', tradeId)
        .single()

      if (tradeError){
        console.error('Error fetching trade data:', tradeError);
        return
      }
        const { requester_item_id, receiver_item_id } = tradeData;

        // Fetch current quantities of both listings
        const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('listing_id, quantity')
        .in('listing_id', [receiver_item_id, requester_item_id]);

      if (fetchError) {
        console.error('Error fetching listing data:', fetchError);
        return;
      } 

      // Calculate new quantities
      const updates = listings.map((listing) => ({
        listing_id: listing.listing_id,
        quantity: Math.max(listing.quantity - 1, 0),
      }));

      // Update each listing's quantity
      for (const update of updates) {
        const { error: updateQtyError } = await supabase
          .from('listings')
          .update({ quantity: update.quantity })
          .eq('listing_id', update.listing_id);

        if (updateQtyError) {
          console.error(`Error updating quantity for ${update.listing_id}:`, updateQtyError);
          return;
        }
      }

      // Mark listings as sold if quantity is 0
      for (const update of updates) {
        if (update.quantity === 0) {
          const { error: soldError } = await supabase
            .from('listings')
            .update({ sold: true })
            .eq('listing_id', update.listing_id);

          if (soldError) {
            console.error(`Error marking listing ${update.listing_id} as sold:`, soldError);
            return;
          }
        }
      }

      toast.success('Trade accepted successfully!');
      
      <div className=""></div>
      // Get trade details for notification
      const trade = incomingTrades.find(t => t.trade_id === tradeId);
      if (trade) {
        // Create notification for the requester
        const notificationContent = `${trade.receiver.first_name} ${trade.receiver.last_name} has accepted your trade request for "${trade.requester_item.title}"`;
        
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              content: notificationContent,
              status: 'Sent',
              created_at: new Date().toISOString(),
              user_id: trade.requester_user_id
            }
          ]);
          
        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
// Step: Fetch updated quantity of the receiver's item
const { data: receiverItemData, error: quantityCheckError } = await supabase
  .from('listings')
  .select('quantity')
  .eq('listing_id', receiver_item_id)
  .single();

  if (quantityCheckError) {
    console.error('Error checking item quantity:', quantityCheckError);
    return;
  }
  
  const currentQuantity = receiverItemData?.quantity ?? 0;

  if (currentQuantity === 0) {
// // Item is sold out, notify and decline other pending trades for this item
const { data: tradeRows, error: uncoughtError } = await supabase
  .from('trades')
  .select('*')
  .eq('receiver_item_id', receiver_item_id)
  .neq('status', 'Accepted')

if (uncoughtError) {
  console.error('Error fetching trades:', uncoughtError)
  return
}

for (const trade of tradeRows) {
  // Manually join the receiver and requester_item info
  const [{ data: receiver }, { data: requesterItem }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name')
      .eq('user_id', trade.receiver_user_id)
      .single(),

    supabase
      .from('listings')
      .select('title')
      .eq('listing_id', trade.requester_item_id)
      .single()
  ])

  if (!receiver || !requesterItem) {
    console.warn(`Skipping trade ${trade.trade_id}: Missing user or item info`)
    continue
  }

  const content = `${receiver.first_name} ${receiver.last_name}'s item has been sold. Your trade request for "${requesterItem.title}" can no longer be completed.`

  const { error: notificationError } = await supabase.from('notifications').insert([
    {
      content,
      status: 'Sent',
      created_at: new Date().toISOString(),
      user_id: trade.requester_user_id
    }
  ]);

    if (notificationError) {
      console.error(`Error sending notification for trade ${trade.trade_id}:`, notificationError)
    }
  }

    // Decline all other pending trades for this sold-out item
    const { error: declineError } = await supabase
    .from('trades')
    .update({ status: 'Declined' })
    .eq('receiver_item_id', receiver_item_id)
    .eq('status', 'Pending')
    .neq('trade_id', tradeId)

    if (declineError) {
      console.error('Error declining trades:', declineError)
      return
    }
  }

  

      // Update the local state
      setIncomingTrades(prevTrades => 
        prevTrades.map(trade => 
          trade.trade_id === tradeId ? { ...trade, status: 'Accepted' } : trade
        )
      )
      
      toast.success('Trade request accepted')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const handleRejectTrade = async (tradeId: number) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'Declined' })
        .eq('trade_id', tradeId)

      if (error) {
        toast.error('Failed to decline trade request')
        console.error('Error declining trade:', error)
        return
      }

      // Get trade details for notification
      const trade = incomingTrades.find(t => t.trade_id === tradeId);
      if (trade) {
        // Create notification for the requester
        const notificationContent = `${trade.receiver.first_name} ${trade.receiver.last_name} has declined your trade request for "${trade.requester_item.title}"`;
        
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              content: notificationContent,
              status: 'Sent',
              created_at: new Date().toISOString(),
              user_id: trade.requester_user_id
            }
          ]);
          
        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Update the local state
      setIncomingTrades(prevTrades => 
        prevTrades.map(trade => 
          trade.trade_id === tradeId ? { ...trade, status: 'Declined' } : trade
        )
      )
      
      toast.success('Trade request declined')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const handleCancelTrade = async (tradeId: number) => {
    try {
      // Get trade details for notification before deleting
      const trade = outgoingTrades.find(t => t.trade_id === tradeId);
      
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('trade_id', tradeId)
        .eq('status', 'Pending')

      if (error) {
        toast.error('Failed to cancel trade request')
        console.error('Error canceling trade:', error)
        return
      }

      if (trade) {
        // Create notification for the receiver
        const notificationContent = `${trade.requester.first_name} ${trade.requester.last_name} has cancelled their trade request for your "${trade.receiver_item.title}"`;
        
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([
            {
              content: notificationContent,
              status: 'Sent',
              created_at: new Date().toISOString(),
              user_id: trade.receiver_user_id
            }
          ]);
          
        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Update the local state
      setOutgoingTrades(prevTrades => 
        prevTrades.filter(trade => trade.trade_id !== tradeId)
      )
      
      toast.success('Trade request cancelled')
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>
      case 'declined':
        return <Badge className="bg-red-500">Declined</Badge>
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Function to handle messaging with a user
  const handleMessageUser = (userId: number) => {
    setSelectedUserId(userId)
    setIsPopoverOpen(true)
  }

  if (loading) {
    return (
      <div className="w-full mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Trade Requests</h1>
        <div className="flex justify-center">
          <div className="animate-pulse flex space-x-4 w-full max-w-4xl">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    
    <div className="w-full mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Trade Requests</h1>
      
      <Tabs defaultValue="incoming" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="incoming">
            Incoming Requests {pendingIncomingTrades.length > 0 && `(${pendingIncomingTrades.length})`}
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing Requests {pendingOutgoingTrades.length > 0 && `(${pendingOutgoingTrades.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed {(completedIncomingTrades.length + completedOutgoingTrades.length) > 0 && 
              `(${completedIncomingTrades.length + completedOutgoingTrades.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="incoming">
          {pendingIncomingTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You don't have any pending incoming trade requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingIncomingTrades.map((trade) => (
                <Card key={trade.trade_id} className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Trade Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <img 
                            src={trade.requester.profile_picture || 
                              `https://api.dicebear.com/7.x/initials/svg?seed=${trade.requester.first_name} ${trade.requester.last_name}`} 
                            alt={`${trade.requester.first_name} ${trade.requester.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        </Avatar>
                        <div>
                          <p className="font-medium">{trade.requester.first_name} {trade.requester.last_name}</p>
                          <p className="text-sm text-gray-500">wants to trade with you</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-lg">
                        {/* Their item */}
                        <div 
                          className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/home/${trade.requester_item.listing_id}`);
                          }}
                        >
                          <p className="text-sm text-gray-500">Their item:</p>
                          <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                            <img 
                              src={trade.requester_item.image1 || "/default-image.jpg"} 
                              alt={trade.requester_item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="font-medium truncate">{trade.requester_item.title}</p>
                          <p className="text-sm">${trade.requester_item.price}</p>
                        </div>
                        
                        {/* For */}
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">for</span>
                        </div>
                        
                        {/* Your item */}
                        <div 
                          className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/home/${trade.receiver_item.listing_id}`);
                          }}
                        >
                          <p className="text-sm text-gray-500">Your item:</p>
                          <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                            <img 
                              src={trade.receiver_item.image1 || "/default-image.jpg"} 
                              alt={trade.receiver_item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="font-medium truncate">{trade.receiver_item.title}</p>
                          <p className="text-sm">${trade.receiver_item.price}</p>
                        </div>
                      </div>
                      
                      {/* Trade comment */}
                      {trade.comments && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 font-medium">Comment:</p>
                          <p className="text-sm">{trade.comments}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Status:</p>
                          {getStatusBadge(trade.status)}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {trade.status === 'Pending' && (
                            <>
                              <Button
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleAcceptTrade(trade.trade_id)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => handleRejectTrade(trade.trade_id)}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          
                          {/* Message button */}
                          <Button
                            variant="outline"
                            className="border-blue-500 text-blue-500 hover:bg-blue-50"
                            onClick={() => handleMessageUser(trade.requester_user_id)}
                          >
                            Message
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-500 self-end">
                          {new Date(trade.created_on).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="outgoing">
          {pendingOutgoingTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You don't have any pending outgoing trade requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOutgoingTrades.map((trade) => (
                <Card key={trade.trade_id} className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Trade Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <img 
                            src={trade.receiver.profile_picture || 
                              `https://api.dicebear.com/7.x/initials/svg?seed=${trade.receiver.first_name} ${trade.receiver.last_name}`} 
                            alt={`${trade.receiver.first_name} ${trade.receiver.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        </Avatar>
                        <div>
                          <p className="font-medium">{trade.receiver.first_name} {trade.receiver.last_name}</p>
                          <p className="text-sm text-gray-500">received your trade request</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-lg">
                        {/* Your item */}
                        <div 
                          className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/home/${trade.requester_item.listing_id}`);
                          }}
                        >
                          <p className="text-sm text-gray-500">Your item:</p>
                          <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                            <img 
                              src={trade.requester_item.image1 || "/default-image.jpg"} 
                              alt={trade.requester_item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="font-medium truncate">{trade.requester_item.title}</p>
                          <p className="text-sm">${trade.requester_item.price}</p>
                        </div>
                        
                        {/* For */}
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">for</span>
                        </div>
                        
                        {/* Their item */}
                        <div 
                          className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/home/${trade.receiver_item.listing_id}`);
                          }}
                        >
                          <p className="text-sm text-gray-500">Their item:</p>
                          <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                            <img 
                              src={trade.receiver_item.image1 || "/default-image.jpg"} 
                              alt={trade.receiver_item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="font-medium truncate">{trade.receiver_item.title}</p>
                          <p className="text-sm">${trade.receiver_item.price}</p>
                        </div>
                      </div>
                      
                      {/* Trade comment */}
                      {trade.comments && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-500 font-medium">Comment:</p>
                          <p className="text-sm">{trade.comments}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Status:</p>
                          {getStatusBadge(trade.status)}
                        </div>
                        {/*
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/*
                          {trade.status === 'Pending' && (
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => handleCancelTrade(trade.trade_id)}
                            >
                              Cancel
                            </Button>
                          )}

                          {/* Message button */}
                          <Button
                            variant="outline"
                            className="border-blue-500 text-blue-500 hover:bg-blue-50"
                            onClick={() => handleMessageUser(trade.receiver_user_id)}
                          >
                            Message
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-500 self-end">
                          {new Date(trade.created_on).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedIncomingTrades.length === 0 && completedOutgoingTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You don't have any completed trade requests.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Incoming completed trades */}
              {completedIncomingTrades.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Incoming Completed Trades</h2>
                  <div className="space-y-4">
                    {completedIncomingTrades.map((trade) => (
                      <Card key={trade.trade_id} className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Trade Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <img 
                                  src={trade.requester.profile_picture || 
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${trade.requester.first_name} ${trade.requester.last_name}`} 
                                  alt={`${trade.requester.first_name} ${trade.requester.last_name}`}
                                  className="h-full w-full object-cover"
                                />
                              </Avatar>
                              <div>
                                <p className="font-medium">{trade.requester.first_name} {trade.requester.last_name}</p>
                                <p className="text-sm text-gray-500">wanted to trade with you</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-lg">
                              {/* Their item */}
                              <div 
                                className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/home/${trade.requester_item.listing_id}`);
                                }}
                              >
                                <p className="text-sm text-gray-500">Their item:</p>
                                <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                                  <img 
                                    src={trade.requester_item.image1 || "/default-image.jpg"} 
                                    alt={trade.requester_item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="font-medium truncate">{trade.requester_item.title}</p>
                                <p className="text-sm">${trade.requester_item.price}</p>
                              </div>
                              
                              {/* For */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium">for</span>
                              </div>
                              
                              {/* Your item */}
                              <div 
                                className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/home/${trade.receiver_item.listing_id}`);
                                }}
                              >
                                <p className="text-sm text-gray-500">Your item:</p>
                                <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                                  <img 
                                    src={trade.receiver_item.image1 || "/default-image.jpg"} 
                                    alt={trade.receiver_item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="font-medium truncate">{trade.receiver_item.title}</p>
                                <p className="text-sm">${trade.receiver_item.price}</p>
                              </div>
                            </div>
                            
                            {/* Trade comment */}
                            {trade.comments && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500 font-medium">Comment:</p>
                                <p className="text-sm">{trade.comments}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">Status:</p>
                                {getStatusBadge(trade.status)}
                              </div>
                              
                              {/* Message button for completed trades */}
                              <div className="flex">
                                <Button
                                  variant="outline"
                                  className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                  onClick={() => handleMessageUser(trade.requester_user_id)}
                                >
                                  Message
                                </Button>
                              </div>
                              
                              <p className="text-sm text-gray-500 self-end">
                                {new Date(trade.created_on).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Outgoing completed trades */}
              {completedOutgoingTrades.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Outgoing Completed Trades</h2>
                  <div className="space-y-4">
                    {completedOutgoingTrades.map((trade) => (
                      <Card key={trade.trade_id} className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Trade Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <img 
                                  src={trade.receiver.profile_picture || 
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${trade.receiver.first_name} ${trade.receiver.last_name}`} 
                                  alt={`${trade.receiver.first_name} ${trade.receiver.last_name}`}
                                  className="h-full w-full object-cover"
                                />
                              </Avatar>
                              <div>
                                <p className="font-medium">{trade.receiver.first_name} {trade.receiver.last_name}</p>
                                <p className="text-sm text-gray-500">received your trade request</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-lg">
                              {/* Your item */}
                              <div 
                                className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/home/${trade.requester_item.listing_id}`);
                                }}
                              >
                                <p className="text-sm text-gray-500">Your item:</p>
                                <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                                  <img 
                                    src={trade.requester_item.image1 || "/default-image.jpg"} 
                                    alt={trade.requester_item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="font-medium truncate">{trade.requester_item.title}</p>
                                <p className="text-sm">${trade.requester_item.price}</p>
                              </div>
                              
                              {/* For */}
                              <div className="flex items-center justify-center">
                                <span className="text-sm font-medium">for</span>
                              </div>
                              
                              {/* Their item */}
                              <div 
                                className="flex-1 border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/home/${trade.receiver_item.listing_id}`);
                                }}
                              >
                                <p className="text-sm text-gray-500">Their item:</p>
                                <div className="aspect-square w-full overflow-hidden rounded-lg mb-2">
                                  <img 
                                    src={trade.receiver_item.image1 || "/default-image.jpg"} 
                                    alt={trade.receiver_item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="font-medium truncate">{trade.receiver_item.title}</p>
                                <p className="text-sm">${trade.receiver_item.price}</p>
                              </div>
                            </div>
                            
                            {/* Trade comment */}
                            {trade.comments && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500 font-medium">Comment:</p>
                                <p className="text-sm">{trade.comments}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500">Status:</p>
                                {getStatusBadge(trade.status)}
                              </div>
                              
                              {/* Message button for completed trades */}
                              <div className="flex">
                                <Button
                                  variant="outline"
                                  className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                  onClick={() => handleMessageUser(trade.receiver_user_id)}
                                >
                                  Message
                                </Button>
                              </div>
                              
                              <p className="text-sm text-gray-500 self-end">
                                {new Date(trade.created_on).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
