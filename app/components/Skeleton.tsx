export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 animate-pulse">
        <div className="h-12 bg-white/10 rounded-xl w-2/3 mx-auto" />
        <div className="h-4 bg-white/5 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-24 bg-white/5 rounded-2xl" />
      <div className="grid md:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl" />)}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );
}

export function LoggerSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-48" />
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
      <div className="h-14 bg-purple-500/20 rounded-xl" />
    </div>
  );
}

export function AdvisorSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-56" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
      </div>
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-8 bg-white/10 rounded w-40" />
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
    </div>
  );
}