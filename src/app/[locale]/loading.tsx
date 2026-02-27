export default function LocaleLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 h-12" />

      <div className="container mx-auto px-4 py-12">
        {/* Title skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-5 w-80 bg-gray-200 rounded mx-auto" />
        </div>

        {/* Card grid skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-40 bg-gray-200" />
              <div className="p-5">
                <div className="h-6 w-48 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
                <div className="flex gap-3">
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
