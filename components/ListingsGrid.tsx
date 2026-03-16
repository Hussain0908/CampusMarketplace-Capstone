import { Skeleton } from "@/components/ui/skeleton"

export function ListingsGrid() {

  const skeletonPosts = Array.from({ length: 20 }, (_, i) => i + 1)

  return (
    <div className="w-full mx-auto">
      <div className="w-full p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {skeletonPosts.map((id) => (
            <div key={id} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}