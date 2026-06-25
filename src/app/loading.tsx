export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading PairDrop...</p>
      </div>
    </div>
  );
}
