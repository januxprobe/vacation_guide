export default function TripLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-200" />

      <div className="container mx-auto px-4 py-12">
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-3" />
              <div className="h-6 w-16 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Quick links skeleton */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-6">
              <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
