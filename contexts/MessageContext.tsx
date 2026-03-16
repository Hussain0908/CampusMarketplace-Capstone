'use client'

import { createContext, useContext, useState } from 'react'

interface Listing {
  listing_id: number;
  title: string;
  price: number;
  image1: string;
}

interface MessageContextType {
  selectedUserId: number | null;
  setSelectedUserId: (userId: number | null) => void;
  selectedListingId: number | null;
  setSelectedListingId: (userId: number | null) => void;
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  initialListing: Listing | null;
  setInitialListing: (listing: Listing | null) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [initialListing, setInitialListing] = useState<Listing | null>(null);

  return (
    <MessageContext.Provider value={{ 
      selectedUserId, 
      setSelectedUserId,
      selectedListingId, 
      setSelectedListingId,
      isPopoverOpen,
      setIsPopoverOpen,
      initialListing,
      setInitialListing
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}