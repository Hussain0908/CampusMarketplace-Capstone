'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useMessage } from '@/contexts/MessageContext';

// Interface for messages (assuming structure includes message_listing_id)
interface Message {
  message_id: number;
  sender_user_id: number;
  receiver_user_id: number;
  content: string;
  created_on: string;
  is_read: boolean;
  message_listing_id?: number | null;
}

// Interface for user details
interface ChatUser {
  user_id: number;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
}

// Interface for a chat room instance (now includes listingId)
interface ChatRoom {
  userId: number; 
  user: ChatUser; 
  listingId: number | null; 
  listingTitle?: string | null; 
  listingImage?: string | null; 
  messages: Message[]; 
  firstMessageSender: number | null; 
  unreadMessagesCount: number; 
}

// Interface for the Listing object used in context/preview
interface Listing {
  listing_id: number;
  title: string;
  price: number;
  image1: string;
}

interface Props {
  currentUserId: number;
}

export default function MessagePopover({ currentUserId }: Props) {
 
  const { selectedUserId, setSelectedUserId, selectedListingId, setSelectedListingId, isPopoverOpen, setIsPopoverOpen, initialListing, setInitialListing } = useMessage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const supabase = createClient();

  const getCurrentRoom = (): ChatRoom | undefined => {
      return chatRooms.find(room => room.userId === selectedUserId && room.listingId === selectedListingId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom when a room is opened or when messages update
    const currentRoom = getCurrentRoom();
    if (currentRoom && isPopoverOpen) {
      scrollToBottom();
    }
  }, [chatRooms, selectedUserId, selectedListingId, isPopoverOpen]); 


  useEffect(() => {
    const fetchBlockedUsers = async () => {
         const { data: { user }, error: userError } = await supabase.auth.getUser();
         if (userError || !user) {
           console.error('Error fetching authenticated user:', userError);
           return;
         }

         const { data: userData, error: userDataError } = await supabase
           .from('users')
           .select('user_id')
           .eq('email', user.email)
           .single();
         if (userDataError) {
           console.error('Error fetching user data:', userDataError);
           return;
         }

         const { data: blockedData, error: blockedError } = await supabase
           .from('blocks')
           .select('blocked_user_id')
           .eq('blocker_user_id', userData.user_id);
         if (blockedError) {
           console.error('Error fetching blocked users:', blockedError);
           return;
         }

         const blockedIds = blockedData.map((block: { blocked_user_id: number }) => block.blocked_user_id);
         setBlockedUsers(blockedIds);
    };
    fetchBlockedUsers();
  }, [currentUserId]);


  // Mark messages as read 
  const markMessagesAsRead = async (otherUserId: number, listingIdForRoom: number | null) => {
    try {
      // Update DB (broad update - mark all from sender to receiver as read)
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_user_id', currentUserId)
        .eq('sender_user_id', otherUserId);

        // .eq(listingIdForRoom === null ? 'message_listing_id' : 'message_listing_id', listingIdForRoom)
  
      if (updateError) throw updateError;

      let updatedTotalUnread = 0;
      setChatRooms(prevRooms => {
        const newRooms = prevRooms.map(room => {
          if (room.userId === otherUserId && room.listingId === listingIdForRoom) {
            return {
              ...room,
              messages: room.messages.map(msg =>
                msg.receiver_user_id === currentUserId && msg.sender_user_id === otherUserId
                  ? { ...msg, is_read: true }
                  : msg
              ),
              unreadMessagesCount: 0, 
            };
          }
          return room;
        });
  
        // Recalculate total unread count
        updatedTotalUnread = newRooms.reduce((sum, room) => sum + room.unreadMessagesCount, 0);
        return newRooms;
      });

      setUnreadCount(updatedTotalUnread);
  
    } catch (error) {
      toast.error('Error marking messages as read:');
    }
  };

  useEffect(() => {
    // Mark as read when the specific room is selected and popover opens
    if (selectedUserId && selectedListingId !== undefined && isPopoverOpen) {
      markMessagesAsRead(selectedUserId, selectedListingId);
    }
  }, [selectedUserId, selectedListingId, isPopoverOpen]);


  // Fetch messages function
  const fetchMessages = async () => {
    if (!currentUserId) return;
  
    // Fetch all messages involving the current user
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_user_id.eq.${currentUserId},receiver_user_id.eq.${currentUserId}`)
      .order('created_on', { ascending: true });
  
    if (messagesError) {
      toast.error('Error fetching messages');
      setChatRooms([]);
      setUnreadCount(0);
      return;
    }
  
    if (!messages || messages.length === 0) {
      setChatRooms([]);
      setUnreadCount(0);
      return;
    }
  
    // Get all unique user IDs involved
    const involvedUserIds = new Set<number>();
    const involvedListingIds = new Set<number>(); 
    messages.forEach(msg => {
      const otherUserId = msg.sender_user_id === currentUserId ? msg.receiver_user_id : msg.sender_user_id;
      involvedUserIds.add(otherUserId);
      if (msg.message_listing_id) {
        involvedListingIds.add(msg.message_listing_id);
      }
    });
  
    // Fetch details for all involved users
    let userMap = new Map<number, ChatUser>();
    if (involvedUserIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, profile_picture')
            .in('user_id', Array.from(involvedUserIds));
        if (usersError) {
            toast.error('Error fetching user details');
        } else {
             usersData?.forEach(u => userMap.set(u.user_id, u));
        }
    }
  
  
    // Fetch details for all involved listings
    let listingMap = new Map<number, { title: string | null; image1: string | null }>();
    if (involvedListingIds.size > 0) {
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('listing_id, title, image1')
        .in('listing_id', Array.from(involvedListingIds));
  
      if (listingsError) {
        toast.error('Error fetching listing details');
      } else {
        listingsData?.forEach(l => listingMap.set(l.listing_id, { title: l.title, image1: l.image1 }));
      }
    }
  
  
    // Group messages into rooms based on otherUser and listingId
    const roomsMap = new Map<string, { otherUserId: number; listingId: number | null; messages: Message[] }>();
    messages.forEach(message => {
      const otherUserId = message.sender_user_id === currentUserId
        ? message.receiver_user_id
        : message.sender_user_id;
      const listingId = message.message_listing_id ?? null;
      const roomKey = `${otherUserId}-${listingId}`;
  
      if (!roomsMap.has(roomKey)) {
        roomsMap.set(roomKey, { otherUserId, listingId, messages: [] });
      }
      roomsMap.get(roomKey)?.messages.push(message);
    });

    let totalUnreadAcrossAllRooms = 0;
    const finalRooms: ChatRoom[] = [];
  
    roomsMap.forEach((roomData) => {
      const userDetails = userMap.get(roomData.otherUserId);

      if (userDetails && roomData.messages.length > 0) {
        const listingDetails = roomData.listingId ? listingMap.get(roomData.listingId) : null;

        const roomUnreadCount = roomData.messages.filter(
          msg => msg.receiver_user_id === currentUserId && !msg.is_read
        ).length;
        totalUnreadAcrossAllRooms += roomUnreadCount; // Add to total
  
        finalRooms.push({
          userId: roomData.otherUserId,
          user: userDetails,
          listingId: roomData.listingId,
          listingTitle: listingDetails?.title ?? (roomData.listingId ? `Listing ${roomData.listingId}` : null), // Fallback title
          listingImage: listingDetails?.image1 ?? null, // Listing image
          messages: roomData.messages,
          firstMessageSender: roomData.messages[0].sender_user_id,
          unreadMessagesCount: roomUnreadCount, // Store per-room count
        });
      }
    });
  
    setChatRooms(finalRooms);
    setUnreadCount(totalUnreadAcrossAllRooms); 
  };


  useEffect(() => {
    fetchMessages();

    // Real-time subscription handler for messaging
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.new) {
            const newMessage = payload.new as Message;

            if (newMessage.sender_user_id !== currentUserId && newMessage.receiver_user_id !== currentUserId) return;

            const otherUserId = newMessage.sender_user_id === currentUserId
              ? newMessage.receiver_user_id
              : newMessage.sender_user_id;
            const listingId = newMessage.message_listing_id ?? null;

             let user = chatRooms.find(room => room.userId === otherUserId)?.user;
              if (!user) {
                const { data: userData } = await supabase.from('users').select('user_id, first_name, last_name, profile_picture').eq('user_id', otherUserId).single();
                if (userData) user = userData;
              }


            if (user) {
               let listingDetails: { title?: string | null; image1?: string | null } | null | undefined = null;
               if (listingId) {
                   const existingRoomWithListing = chatRooms.find(r => r.listingId === listingId);
                   if (existingRoomWithListing) {
                       listingDetails = { title: existingRoomWithListing.listingTitle, image1: existingRoomWithListing.listingImage };
                   } else {
                       const { data: listingData } = await supabase.from('listings').select('title, image1').eq('listing_id', listingId).single();
                       if (listingData) listingDetails = listingData;
                   }
               }

              setChatRooms(prevRooms => {
                  let roomFound = false;
                  const updatedRooms = prevRooms.map(room => {
                      if (room.userId === otherUserId && room.listingId === listingId) {
                          roomFound = true;
                          const newUnreadCount = room.unreadMessagesCount + (newMessage.receiver_user_id === currentUserId ? 1 : 0);
                          return {
                              ...room,
                              messages: [...room.messages, newMessage],
                              unreadMessagesCount: newUnreadCount,
                          };
                      }
                      return room;
                  });

                  if (!roomFound) {
                      // Create a new room object for this user and listing combined
                      updatedRooms.push({
                          userId: otherUserId,
                          user,
                          messages: [newMessage],
                          firstMessageSender: newMessage.sender_user_id,
                          listingId: listingId,
                          listingTitle: listingDetails?.title ?? (listingId ? `Listing ${listingId}` : null),
                          listingImage: listingDetails?.image1 ?? null,
                          unreadMessagesCount: (newMessage.receiver_user_id === currentUserId ? 1 : 0),
                      });
                  }
                  return updatedRooms;
              });

              if (newMessage.receiver_user_id === currentUserId) {
                   // Check if user is currently viewing the  room for this message
                   const isViewingThisRoom = isPopoverOpen && selectedUserId === otherUserId && selectedListingId === listingId;
                   if (!isViewingThisRoom) {
                       setUnreadCount(prev => prev + 1); 
                   } else {
                        markMessagesAsRead(otherUserId, listingId);
                   }
              }
            }
          }
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
           if (payload.new?.receiver_user_id === currentUserId || payload.new?.sender_user_id === currentUserId) {
                console.log("Message update detected, refetching messages...");
                fetchMessages();
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, isPopoverOpen, selectedUserId, selectedListingId]);


  // Send Message function
  const sendMessage = async () => {
    if (!selectedUserId || selectedListingId === undefined || !newMessage.trim()) return;

    const receiverId = selectedUserId;

     // Check if the receiver has blocked the current user
    const { data: blockData } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_user_id', receiverId)
      .eq('blocked_user_id', currentUserId)
      .maybeSingle();

    if (blockData) {
      toast.error("You cannot send a message because this user has blocked you.");
      return;
    }
    // Check if the current user has blocked the receiver
    if (blockedUsers.includes(receiverId)) {
      toast.error('You have blocked this user. You cannot send messages to them.');
      return;
    }

    try {
      // Find the specific room based on user and listing ID
      const currentRoom = getCurrentRoom();
      const isFirstMessageInThisRoom = !currentRoom?.messages.length;

      let messageContent = newMessage.trim();
      let listingIdToInsert: number | null = selectedListingId; 

      // First message will incude listing details
      if (isFirstMessageInThisRoom && initialListing) {
        messageContent = JSON.stringify({
          type: 'listing',
          listing: {
            id: initialListing.listing_id,
            title: initialListing.title,
            price: initialListing.price,
            image: initialListing.image1,
          },
          message: newMessage.trim(),
        });

        listingIdToInsert = initialListing.listing_id;
       // console.log("Listing ID to insert: ", listingIdToInsert);

      } else if (!isFirstMessageInThisRoom && currentRoom) {
         listingIdToInsert = currentRoom.listingId;
         // console.log("Using current room's Listing ID: ", listingIdToInsert);
      }


      // Data being sent to messages table
      const messageDataToInsert: {
          sender_user_id: number;
          receiver_user_id: number;
          content: string;
          is_read: boolean;
          message_listing_id?: number | null;
      } = {
          sender_user_id: currentUserId,
          receiver_user_id: receiverId,
          content: messageContent,
          is_read: false,
      };

      if (listingIdToInsert !== null && listingIdToInsert !== undefined) {
          messageDataToInsert.message_listing_id = listingIdToInsert;
      } else {
          messageDataToInsert.message_listing_id = null; 
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageDataToInsert)
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');

      if (isFirstMessageInThisRoom && initialListing && initialListing.listing_id === listingIdToInsert) {
        setInitialListing(null);
      }

      scrollToBottom();

    } catch (error) {
        console.error("Error sending message:", error);
        toast.error('Error sending message');
    }
  };


  // Render listing preview
  const renderListingPreview = () => {
    if (!initialListing) return null;

    return (
      <div className="px-4 py-2 border-b">
        <div className="flex items-start space-x-2 bg-gray-50 p-2 rounded-lg">
          <img
            src={initialListing.image1}
            alt={initialListing.title}
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1">
            <p className="font-medium ">{initialListing.title}</p>
            <p className="text-blue-600 font-semibold">
              ${initialListing.price}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render message content
  const renderMessage = (message: Message) => {
    try {
      const content = JSON.parse(message.content);
      if (content && typeof content === 'object' && content.type === 'listing') {
        return (
          <div className="flex flex-col space-y-2">
            {/* Display listing details */}
            <div className="flex items-start space-x-2 bg-gray-50 p-2 rounded-lg">
              <img
                src={content.listing.image}
                alt={content.listing.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-black">{content.listing.title}</p>
                <p className="text-blue-600 font-semibold">
                  ${content.listing.price}
                </p>
              </div>
            </div>
            {/* Display the actual text message */}
            {content.message && <p>{content.message}</p>}
          </div>
        );
      }
    } catch (e) {
      // Content is not JSON or not the expected structure, treat as plain text
      return message.content;
    }
    return message.content;
  };

  // Render Rate Button
  const renderRateButton = () => {
     const currentRoom = getCurrentRoom();
     if (!currentRoom) return null;

     const buyerHasSent3Messages = currentRoom.messages.filter(
       msg => msg.sender_user_id === currentRoom.firstMessageSender
     ).length >= 3;

     const sellerHasSent2Messages = currentRoom.messages.filter(
       msg => msg.sender_user_id !== currentRoom.firstMessageSender
     ).length >= 2;

     if (buyerHasSent3Messages && sellerHasSent2Messages && currentRoom.firstMessageSender === currentUserId) {
        // The seller is the 'other' user in the room
       const sellerUserId = currentRoom.userId;
       return (
         <Button
           variant="outline"
           className="mt-2 w-full"
           onClick={() => window.location.href = `/home/review/${sellerUserId}`} 
         >
           Rate This Seller
         </Button>
       );
     }
     return null;
  };

   // Block/Unblock User
   const handleBlockUser = async (blockedUserId: number) => {
     try {
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError || !user) {
         toast.error('Please log in to block a user');
         return;
       }

       const { data: userData, error: userDataError } = await supabase
         .from('users')
         .select('user_id')
         .eq('email', user.email)
         .single();

       if (userDataError) {
         toast.error('Error fetching user data');
         console.error('User data error:', userDataError);
         return;
       }

       const { data: existingBlock, error: blockError } = await supabase
         .from('blocks')
         .select('*')
         .eq('blocker_user_id', userData.user_id)
         .eq('blocked_user_id', blockedUserId)
         .maybeSingle();

       if (existingBlock) {
         toast.error('You have already blocked this user.');
         return;
       }

       console.log('blocker_user_id:', userData.user_id);
       console.log('blocked_user_id:', blockedUserId);

       const { data, error, status } = await supabase
         .from('blocks')
         .insert({
           blocker_user_id: userData.user_id,
           blocked_user_id: blockedUserId,
         });

       if (error) {
         toast.error('Failed to block user');
         console.error('Block error:', error, 'Status:', status, 'Data:', data);
         return;
       }

       toast.success('User blocked successfully');
       setBlockedUsers((prevBlocked) => [...prevBlocked, blockedUserId]);
     } catch (error) {
       console.error('Error blocking user:', error);
       toast.error(`An error occurred while blocking the user: ${error}`);
     }
   };

   const handleUnblockUser = async (blockedUserId: number) => {
     try {
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError || !user) {
         toast.error('Please log in to unblock a user');
         return;
       }

       const { data: userData, error: userDataError } = await supabase
         .from('users')
         .select('user_id')
         .eq('email', user.email)
         .single();

       if (userDataError) {
         toast.error('Error fetching user data');
         console.error('User data error:', userDataError);
         return;
       }

       const { data, error, status } = await supabase
         .from('blocks')
         .delete()
         .eq('blocker_user_id', userData.user_id)
         .eq('blocked_user_id', blockedUserId);

       if (error) {
         toast.error('Failed to unblock user');
         console.error('Unblock error:', error, 'Status:', status, 'Data:', data);
         return;
       }

       toast.success('User unblocked successfully');
       setBlockedUsers((prevBlocked) => prevBlocked.filter((userId) => userId !== blockedUserId));
     } catch (error) {
       console.error('Error unblocking user:', error);
       toast.error(`An error occurred while unblocking the user: ${error}`);
     }
   };


  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
           <MessageSquare className="h-5 w-5" />
           {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
               {unreadCount}
             </span>
           )}
         </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Chat View */}
        {selectedUserId && selectedListingId !== undefined ? (() => {
            const currentRoom = getCurrentRoom();

            return (
            <div className="flex flex-col h-[500px]">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => { 
                      setSelectedUserId(null);
                      setSelectedListingId(null);
                      setInitialListing(null);
                    }}
                    className="p-2"
                  >
                    ←
                  </Button>

                  {/* Listing Title & User Name */}
                  {currentRoom && (
                    <div className="flex-1 overflow-hidden mr-2">
                      <p className="font-semibold text-sm truncate" title={currentRoom.listingTitle ?? undefined}>
                        {currentRoom.listingTitle || (currentRoom.listingId ? `Listing ${currentRoom.listingId}`: 'Direct Message')}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={`${currentRoom.user.first_name} ${currentRoom.user.last_name}`}>
                        {currentRoom.user.first_name} {currentRoom.user.last_name}
                      </p>
                    </div>
                  )}

                  {/* Block/Unblock Button */}
                  {selectedUserId && (
                     <Button
                        variant="ghost"
                        onClick={() => {
                           if (blockedUsers.includes(selectedUserId)) handleUnblockUser(selectedUserId);
                           else handleBlockUser(selectedUserId);
                        }}
                        className={`p-1 text-xs whitespace-nowrap ${blockedUsers.includes(selectedUserId) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
                       // style={{ marginLeft: 'auto' }} // Removed fixed push, rely on flex spacing
                      >
                        {blockedUsers.includes(selectedUserId) ? 'Unblock' : 'Block'}
                     </Button>
                  )}

                </div>
              </div>

               {/* Listing Preview */}
              {(!currentRoom?.messages.length && initialListing && initialListing.listing_id === selectedListingId) &&
                renderListingPreview()
              }

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4"> 
                  {currentRoom?.messages.map(message => (
                    <div
                      key={message.message_id}
                      className={`flex flex-col ${
                        message.sender_user_id === currentUserId
                          ? 'items-end' 
                          : 'items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg shadow-sm ${
                          message.sender_user_id === currentUserId
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-800' 
                        } max-w-[80%]`} 
                      >
                        {renderMessage(message)}
                      </div>

                      {/* Timestamp and Read Status */}
                      <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-400 ${
                         message.sender_user_id === currentUserId ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>
                          {new Date(message.created_on).toLocaleTimeString([], {
                            hour: 'numeric', 
                            minute: '2-digit'
                          })}
                        </span>

                        {/* Show Read/Delivered status */}
                        {message.sender_user_id === currentUserId && (
                          <span className="text-xs">
                            • {message.is_read ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Scrolling to the bottom */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input Area */}
              <div className="p-4 border-t">
                 <div className="flex space-x-2">
                    <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>Send</Button>
                 </div>
              </div>
              {/* Rate Seller Button */}
              {renderRateButton()} 
            </div>
          )})()
        : (
          // Chat List View
          <div className="flex flex-col h-[500px]">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {chatRooms.length === 0 && ( <p className="text-center text-gray-500 p-4">No messages yet.</p> )}
                {chatRooms.map(room => {
                   const lastMessage = room.messages[room.messages.length - 1];
                   let lastMessageContent = lastMessage?.content ?? "No messages yet";
                   try {
                       const parsed = JSON.parse(lastMessageContent);
                       if (parsed && parsed.type === 'listing') {
                           lastMessageContent = `Listing: ${parsed.listing.title} - ${parsed.message || ''}`;
                       }
                   } catch (e) { /* Skip */ }

                  return (
                  <Button
                    key={`${room.userId}-${room.listingId}`}
                    variant="ghost"
                    className="w-full p-2 h-auto justify-start text-left relative"
                    onClick={() => {
                      setSelectedUserId(room.userId);
                      setSelectedListingId(room.listingId);
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      {/* Use Listing Photo Instead of User Avatar */}
                      <Avatar className="h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center border bg-gray-100"> {/* Added border, centering, fallback bg */}
                        {room.listingId === null ? (
                          <User className="h-6 w-6 text-gray-500" />
                        ) : (
                          <>
                            <AvatarImage
                              src={room.listingImage || undefined} 
                              alt={room.listingTitle || 'Listing image'}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs font-semibold">
                              {/* Uses listing title initials as fallback */}
                              {room.listingTitle ? room.listingTitle.substring(0, 2).toUpperCase() : '??'}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>

                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate text-sm max-w-[295px]" title={room.listingTitle ?? `${room.user.first_name} ${room.user.last_name}`}>
                           {/* Use Listing Title for listing chats */}
                          {room.listingId !== null
                             ? (room.listingTitle || `Listing ${room.listingId}`)
                             : `${room.user.first_name} ${room.user.last_name}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={room.listingId !== null ? `${room.user.first_name} ${room.user.last_name}` : 'Direct Message'}>
                           {/* Show User Name for listing chats */}
                           {/* Direct Message label if not listing */}
                           {room.listingId !== null ? `${room.user.first_name} ${room.user.last_name}` : 'Direct Message'}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-1 max-w-[270px]">
                          {lastMessageContent}
                        </p>
                      </div>

                      {room.unreadMessagesCount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {room.unreadMessagesCount}
                        </span>
                      )}
                    </div>
                  </Button>
                )})}
              </div>
            </ScrollArea>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}