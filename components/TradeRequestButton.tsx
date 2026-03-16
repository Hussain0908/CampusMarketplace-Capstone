"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
interface TradeRequestButtonProps {
  listingId: string;
  className?: string;
}
export function TradeRequestButton({ listingId, className }: TradeRequestButtonProps) {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/home/requestTrade/${listingId}`);
  };
  return (
    <Button
      onClick={handleClick}
      className={className}
      variant="secondary"
    >
      <ArrowRightLeft className="mr-2 h-4 w-4" />
      Request Trade
    </Button>
  );
}