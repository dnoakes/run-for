
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background pt-24 px-4 pb-12 flex flex-col items-center animate-in fade-in duration-500">
            <div className="w-full max-w-5xl space-y-8">

                {/* Header Skeleton */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Action Card Skeleton */}
                    <Skeleton className="h-[400px] rounded-2xl" />

                    {/* History Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
