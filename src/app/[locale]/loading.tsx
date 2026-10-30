import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PageLoading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="container-page pb-16 pt-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-card" />
          ))}
        </div>
      </div>
    </>
  );
}
