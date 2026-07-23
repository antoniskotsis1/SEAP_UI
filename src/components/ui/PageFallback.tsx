export function PageFallback() {
  return (
    <div className="flex h-40 items-center justify-center" aria-busy="true">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gold-500" />
    </div>
  );
}
