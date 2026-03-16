"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; 
import { useRouter } from "next/navigation";
import { ListingsGrid } from "@/components/ListingsGrid"; 
import { CategoryListingsDisplay } from "@/components/CategoryListingsDisplay";

const supabase = createClient();

const TextbooksPage = () => {
  const router = useRouter();

  const [listings, setListings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data: {user}, error: userError} = await supabase.auth.getUser();
        if (!user){
          router.push('/login');
          return;
        }


        const { data: userData, error: userDataError} = await supabase
        .from('users')
        .select('user_id, university_id')
        .eq('email', user.email)
        .single();

        if (userDataError || !userData) {
          console.error('Error fetching user data:', userDataError);
          setError("Error fetching user data.");
          return;
        }

        const currentUserId = userData.user_id;
        const universityId = userData.university_id;

        const  { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('blocker_user_id')
        .eq('blocked_user_id', currentUserId);

      if (blocksError) {
        console.error('Error fetching blocks:', blocksError);
      }

      const blockedBy = blocksData?.map((block: { blocker_user_id: number }) => block.blocker_user_id) || [];
      
      const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("listing_id, title, price, description, image1, category, openToTrade, users (user_id)")
          .eq("category", "Textbooks")
          .eq('is_active', true)
          .eq('sold', false)
          .eq("university_id", universityId)
          .order("title", { ascending: true });



        if (listingsError || !listingsData) {
          console.error("Error fetching textbooks listings:", listingsError);
          setError("Error loading listings.");
          return;
        }
        const filteredListings = listingsData.filter((listing: any) =>
        listing.users.user_id !== currentUserId && !blockedBy.includes(listing.users.user_id)
        );
        setListings(filteredListings);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [router]);

  return (
    <CategoryListingsDisplay
      title="Textbooks"
      listings={listings}
      loading={loading}
      error={error}
      LoadingComponent={ListingsGrid}
    />
  );
};

export default TextbooksPage;